import { useState, type CSSProperties } from 'react'

import type { BaseTrip } from '../model/trip'
import { getLocalDateString } from '../utils/classify-trips'
import styles from './TripCalendar.module.css'

type TripCalendarProps = {
  trips: BaseTrip[]
  onOpenTrip: (trip: BaseTrip) => void
}

type CalendarMonth = {
  year: number
  monthIndex: number
}

type TripDayStyle = CSSProperties & {
  '--trip-day-color': string
}

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function monthFromDate(date: string): CalendarMonth {
  const [year, month] = date.split('-').map(Number)

  return { year, monthIndex: month - 1 }
}

function shiftMonth(
  { year, monthIndex }: CalendarMonth,
  offset: number,
): CalendarMonth {
  const shiftedDate = new Date(Date.UTC(year, monthIndex + offset, 1))

  return {
    year: shiftedDate.getUTCFullYear(),
    monthIndex: shiftedDate.getUTCMonth(),
  }
}

function toDateString(year: number, monthIndex: number, day: number) {
  return [
    year,
    String(monthIndex + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function getInitialMonth(trips: BaseTrip[]) {
  const today = getLocalDateString()
  const firstRelevantTrip = [...trips]
    .filter((trip) => trip.endDate >= today)
    .sort((firstTrip, secondTrip) =>
      firstTrip.startDate.localeCompare(secondTrip.startDate),
    )[0]

  return monthFromDate(firstRelevantTrip?.startDate ?? today)
}

function formatAccessibleDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function TripCalendar({
  trips,
  onOpenTrip,
}: TripCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getInitialMonth(trips),
  )
  const today = getLocalDateString()
  const daysInMonth = new Date(
    Date.UTC(visibleMonth.year, visibleMonth.monthIndex + 1, 0),
  ).getUTCDate()
  const firstWeekDay =
    (new Date(
      Date.UTC(visibleMonth.year, visibleMonth.monthIndex, 1),
    ).getUTCDay() +
      6) %
    7
  const trailingDays = 42 - firstWeekDay - daysInMonth
  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(
      Date.UTC(visibleMonth.year, visibleMonth.monthIndex, 1),
    ),
  )

  const showToday = () => {
    setVisibleMonth(monthFromDate(today))
  }

  return (
    <section className={styles.calendar} aria-labelledby="calendar-title">
      <header className={styles.header}>
        <h2 id="calendar-title" className={styles.month}>
          {monthLabel}
        </h2>
        <div className={styles.controls}>
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() =>
              setVisibleMonth((currentMonth) =>
                shiftMonth(currentMonth, -1),
              )
            }
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            className={styles.todayButton}
            type="button"
            onClick={showToday}
          >
            Hoy
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() =>
              setVisibleMonth((currentMonth) =>
                shiftMonth(currentMonth, 1),
              )
            }
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </header>

      <div className={styles.weekDays} aria-hidden="true">
        {weekDays.map((weekDay) => (
          <span key={weekDay}>{weekDay}</span>
        ))}
      </div>

      <div className={styles.days}>
        {Array.from({ length: firstWeekDay }, (_, index) => (
          <span
            className={styles.emptyDay}
            key={`leading-${index}`}
            aria-hidden="true"
          />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1
          const date = toDateString(
            visibleMonth.year,
            visibleMonth.monthIndex,
            day,
          )
          const dayTrips = trips.filter(
            (trip) => trip.startDate <= date && trip.endDate >= date,
          )
          const content = (
            <>
              <span
                className={`${styles.dayNumber} ${
                  dayTrips.length > 0 ? styles.tripDate : ''
                }`}
                style={
                  dayTrips.length > 0
                    ? ({
                        '--trip-day-color': dayTrips[0].color,
                      } as TripDayStyle)
                    : undefined
                }
              >
                {day}
              </span>
              <span className={styles.marks} aria-hidden="true">
                {date === today && <span className={styles.todayMark} />}
              </span>
            </>
          )

          if (dayTrips.length === 0) {
            return (
              <span className={styles.day} key={date}>
                {content}
              </span>
            )
          }

          const tripNames = dayTrips.map((trip) => trip.name).join(', ')

          return (
            <button
              className={`${styles.day} ${styles.tripDay}`}
              type="button"
              key={date}
              aria-label={`${formatAccessibleDate(date)}. ${tripNames}`}
              onClick={() => onOpenTrip(dayTrips[0])}
            >
              {content}
            </button>
          )
        })}

        {Array.from({ length: trailingDays }, (_, index) => (
          <span
            className={styles.emptyDay}
            key={`trailing-${index}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  )
}
