/**
 * Smart timestamp formatting that shows appropriate level of detail based on message age
 */
export function formatSmartTimestamp(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  
  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  // Same day (today)
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // Yesterday
  if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `Yesterday ${timeStr}`
  }
  
  // This week (2-6 days ago)
  if (diffDays <= 6) {
    const dayStr = date.toLocaleDateString([], { weekday: 'short' })
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${dayStr} ${timeStr}`
  }
  
  // This year (more than a week ago)
  if (now.getFullYear() === date.getFullYear()) {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  
  // Different year
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric'
  })
}

/**
 * Format timestamp for accessibility/screen readers with full context
 */
export function formatTimestampForScreenReader(timestamp: string): string {
  const date = new Date(timestamp)
  
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  // Same day
  if (diffDays === 0) {
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `today at ${timeStr}`
  }
  
  // Yesterday
  if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `yesterday at ${timeStr}`
  }
  
  // This week
  if (diffDays <= 6) {
    const dayStr = date.toLocaleDateString([], { weekday: 'long' })
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return `${dayStr} at ${timeStr}`
  }
  
  // Older messages - use full date and time
  return date.toLocaleDateString([], { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  })
}