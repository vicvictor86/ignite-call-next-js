import { useState } from 'react'
import { CalendarStep } from './calendarStep'
import { ConfirmStep } from './confirmStep'

export function SchedulerForm() {
  const [selectedDateTime, setSelectedDatetime] = useState<Date | null>()

  function onClearConfirmation() {
    setSelectedDatetime(null)
  }

  if (selectedDateTime) {
    return (
      <ConfirmStep
        schedulingDate={selectedDateTime}
        onClearConfirmation={onClearConfirmation}
      />
    )
  }

  return <CalendarStep onSelectedTime={setSelectedDatetime} />
}
