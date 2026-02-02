'use client'

import { motion, useInView, Variants } from 'framer-motion'
import { useRef, memo, ReactNode } from 'react'

// =====================================================
// ANIMATION VARIANTS
// =====================================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

// =====================================================
// ANIMATED SECTION WRAPPER
// =====================================================

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
}

export const AnimatedSection = memo(function AnimatedSection({
  children,
  className = '',
}: AnimatedSectionProps) {
  const ref = useRef(null)
  // Reduced margin and added amount for less aggressive triggering
  const isInView = useInView(ref, { once: true, margin: '-50px', amount: 0.1 })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
})
