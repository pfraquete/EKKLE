-- Create Request Status Enum
create type request_status as enum ('PENDING', 'APPROVED', 'REJECTED');

-- Create Cell Requests Table
create table if not exists cell_requests (
  id uuid primary key default uuid_generate_v4(),
  church_id uuid not null references churches(id) on delete cascade,
  cell_id uuid not null references cells(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  status request_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_cell_requests_church_id on cell_requests(church_id);
create index if not exists idx_cell_requests_cell_id on cell_requests(cell_id);
create index if not exists idx_cell_requests_profile_id on cell_requests(profile_id);
create index if not exists idx_cell_requests_status on cell_requests(status);

-- RLS
alter table cell_requests enable row level security;

-- Insert: Authenticated users can request to join
create policy "Users can create join requests" on cell_requests
  for insert with check (auth.uid() = profile_id);

-- View: User can see own requests
create policy "Users can view own requests" on cell_requests
  for select using (auth.uid() = profile_id);

-- View: Leaders of the cell can see requests
create policy "Leaders and Pastors can view requests" on cell_requests
  for select using (
    exists (
      select 1 from cells
      where cells.id = cell_requests.cell_id
      and cells.leader_id = auth.uid()
    )
    or
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'PASTOR'
        and profiles.church_id = cell_requests.church_id
    )
  );

-- Update: Leaders can update requests (Approve/Reject)
create policy "Leaders and Pastors can manage requests" on cell_requests
  for update using (
    exists (
      select 1 from cells
      where cells.id = cell_requests.cell_id
      and cells.leader_id = auth.uid()
    )
    or
    exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'PASTOR'
        and profiles.church_id = cell_requests.church_id
    )
  );
