import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const username = String(req.query.username)

  if (!username) {
    return res.status(400).json({
      message: 'Username is required',
    })
  }

  const { year, month } = req.query

  if (!year || !month) {
    return res.status(400).json({
      message: 'Year and month are required',
    })
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })

  if (!user) {
    return res.status(400).json({
      message: 'User does not exist',
    })
  }

  const availableWeekDays = await prisma.userTimeInterval.findMany({
    select: {
      weekDay: true,
    },
    where: {
      userId: user.id,
    },
  })

  const blockedWeekDays = [0, 1, 2, 3, 4, 5, 6].filter((weekDay) => {
    return !availableWeekDays.some(
      (availableWeekDay) => availableWeekDay.weekDay === weekDay,
    )
  })

  const blockedDatesRaw: Array<{ schedule_day: number }> =
    await prisma.$queryRaw`
    SELECT
      EXTRACT(DAY FROM S.date)::int AS schedule_day,
      COUNT(S.date) AS scheduling_amount,
      ((UTI.end_hour - UTI.start_hour) / 60) AS hours_available_amount
    FROM schedulings S
    LEFT JOIN user_time_intervals UTI
      ON UTI.week_day = EXTRACT(DOW FROM S.date)
    WHERE S.user_id = ${user.id}
      AND TO_CHAR(S.date, 'YYYY-FMMM') = ${`${year}-${month}`}
    GROUP BY EXTRACT(DAY FROM S.date),
      ((UTI.end_hour - UTI.start_hour) / 60)
    HAVING COUNT(S.date) >= ((UTI.end_hour - UTI.start_hour) / 60)
  `

  const blockedDates = blockedDatesRaw.map(
    (blockedDate) => blockedDate.schedule_day,
  )

  return res.json({ blockedWeekDays, blockedDates })
}
