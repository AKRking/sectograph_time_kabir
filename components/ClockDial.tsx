'use client';

import { Task } from '@/types/task';
import { getAngleFromMinutes, getCurrentTimeInMinutes, getPeriodForTime } from '@/lib/time';
import { useMemo, useEffect, useState } from 'react';

interface ClockDialProps {
  period: 'am' | 'pm';
  tasks: Task[];
}

interface TaskArc {
  id: string;
  title: string;
  startAngle: number;
  endAngle: number;
  color: string;
  startTime: number;
  endTime: number;
}

export function ClockDial({ period, tasks }: ClockDialProps) {
  const radius = 150;
  const centerX = 200;
  const centerY = 200;
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);

  const periodStart = period === 'am' ? 0 : 720;
  const periodEnd = period === 'am' ? 720 : 1440;

  const taskArcs = useMemo<TaskArc[]>(() => {
    return tasks
      .filter((task) => {
        const taskPeriodStart = task.start_time < 720 ? 0 : 720;
        const taskPeriodEnd = task.end_time <= 720 ? 720 : 1440;

        if (period === 'am') {
          return task.start_time < 720;
        } else {
          return task.end_time > 720;
        }
      })
      .map((task) => {
        let startTime = task.start_time;
        let endTime = task.end_time;

        if (period === 'am' && endTime > 720) {
          endTime = 720;
        }
        if (period === 'pm' && startTime < 720) {
          startTime = 720;
        }

        const startAngle = getAngleFromMinutes(startTime, period);
        const endAngle = getAngleFromMinutes(endTime, period);

        return {
          id: task.id,
          title: task.title,
          startAngle,
          endAngle,
          color: task.color,
          startTime,
          endTime,
        };
      });
  }, [tasks, period]);

  useEffect(() => {
    const updateCurrentAngle = () => {
      const currentMinutes = getCurrentTimeInMinutes();
      const currentPeriod = getPeriodForTime(currentMinutes);

      if (currentPeriod === period) {
        const angle = getAngleFromMinutes(currentMinutes, period);
        setCurrentAngle(angle);
      } else {
        setCurrentAngle(null);
      }
    };

    updateCurrentAngle();
    const interval = setInterval(updateCurrentAngle, 60000);

    return () => clearInterval(interval);
  }, [period]);

  const arcPath = (startAngle: number, endAngle: number): string => {
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const timeLabels = [
    { label: '12', angle: 0 },
    { label: '1', angle: 30 },
    { label: '2', angle: 60 },
    { label: '3', angle: 90 },
    { label: '4', angle: 120 },
    { label: '5', angle: 150 },
    { label: '6', angle: 180 },
    { label: '7', angle: 210 },
    { label: '8', angle: 240 },
    { label: '9', angle: 270 },
    { label: '10', angle: 300 },
    { label: '11', angle: 330 },
  ];

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-4 text-slate-700">
        {period.toUpperCase()}
      </h2>

      <svg width="400" height="400" viewBox="0 0 400 400" className="drop-shadow-lg">
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="#64748b"
        />

        {taskArcs.map((arc) => (
          <g key={arc.id}>
            <title>{arc.title}</title>
            <path
              d={arcPath(arc.startAngle, arc.endAngle)}
              fill={arc.color}
              fillOpacity="0.7"
              stroke={arc.color}
              strokeWidth="1"
              className="hover:fill-opacity-90 transition-all cursor-pointer"
            />
          </g>
        ))}

        {currentAngle !== null && (
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * Math.cos(((currentAngle - 90) * Math.PI) / 180)}
            y2={centerY + radius * Math.sin(((currentAngle - 90) * Math.PI) / 180)}
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}

        {timeLabels.map((time) => {
          const angle = (time.angle * Math.PI) / 180;
          const x = centerX + (radius - 30) * Math.cos(angle - Math.PI / 2);
          const y = centerY + (radius - 30) * Math.sin(angle - Math.PI / 2);

          return (
            <text
              key={time.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fontWeight="600"
              fill="#475569"
            >
              {time.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
