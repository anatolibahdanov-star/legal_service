import { useState } from 'react'

export const useServices = () => {
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [hoveredService, setHoveredService] = useState<number | null>(null)

  const handleServiceClick = (index: number) => {
    setSelectedService(selectedService === index ? null : index)
  }

  const handleServiceHover = (index: number | null) => {
    setHoveredService(index)
  }

  const isServiceSelected = (index: number) => selectedService === index
  const isServiceHovered = (index: number) => hoveredService === index

  return {
    handleServiceClick,
    handleServiceHover,
    isServiceSelected,
    isServiceHovered,
  }
}