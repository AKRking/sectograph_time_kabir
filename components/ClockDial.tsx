'use client';

import { Task } from '@/types/task';
import {
  getAngleFromMinutes,
  getCurrentTimeInMinutes,
  getDisplayTime,
  getPeriodForTime,
} from '@/lib/time';
import { useMemo, useEffect, useState } from 'react';

interface ClockDialProps {
  period: 'am' | 'pm';
  tasks: Task[];
  interactive?: boolean;
  minuteStep?: number;
  selectedTime?: number | null;
  previewTask?: Task | null;
  onSelectTime?: (minutes: number) => void;
  onTaskClick?: (task: Task) => void;
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

export function ClockDial({
  period,
  tasks,
  interactive = false,
  minuteStep = 5,
  selectedTime = null,
  previewTask = null,
  onSelectTime,
  onTaskClick,
}: ClockDialProps) {
  const radius = 150;
  const centerX = 200;
  const centerY = 200;
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);

  const taskArcs = useMemo<TaskArc[]>(() => {
    return tasks
      .filter((task) => {
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

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const interactiveMarkerAngle = useMemo(() => {
    if (selectedTime === null) return null;
    const markerPeriod = selectedTime < 720 ? 'am' : 'pm';
    if (markerPeriod !== period) return null;
    return getAngleFromMinutes(selectedTime, period);
  }, [period, selectedTime]);

  const previewArc = useMemo<TaskArc | null>(() => {
    if (!previewTask) return null;
    if (period === 'am' && previewTask.start_time >= 720) return null;
    if (period === 'pm' && previewTask.end_time <= 720) return null;

    let startTime = previewTask.start_time;
    let endTime = previewTask.end_time;

    if (period === 'am' && endTime > 720) {
      endTime = 720;
    }
    if (period === 'pm' && startTime < 720) {
      startTime = 720;
    }

    return {
      id: `${previewTask.id}-preview`,
      title: previewTask.title,
      startAngle: getAngleFromMinutes(startTime, period),
      endAngle: getAngleFromMinutes(endTime, period),
      color: previewTask.color,
      startTime,
      endTime,
    };
  }, [period, previewTask]);

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

  const getSnappedMinutesFromPoint = (clientX: number, clientY: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const dx = x - centerX;
    const dy = y - centerY;

    const rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const angleFromTop = (rawAngle + 450) % 360;

    const stepAngle = Math.max(0.5, minuteStep * 0.5);
    const snappedAngle = Math.round(angleFromTop / stepAngle) * stepAngle;
    const periodMinutes = Math.round(snappedAngle / 0.5) % 720;
    const periodOffset = period === 'am' ? 0 : 720;

    return periodOffset + periodMinutes;
  };

  const handleDialClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onSelectTime) return;
    const minutes = getSnappedMinutesFromPoint(event.clientX, event.clientY, event.currentTarget);
    onSelectTime(minutes);
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

      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className={`drop-shadow-lg ${interactive ? 'cursor-crosshair' : ''}`}
        onClick={handleDialClick}
      >
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
              className="hover:fill-opacity-90 transition-all duration-300 cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                const clickedTask = taskById.get(arc.id);
                if (clickedTask && onTaskClick) onTaskClick(clickedTask);
              }}
            />
          </g>
        ))}

        {previewArc && (
          <path
            d={arcPath(previewArc.startAngle, previewArc.endAngle)}
            fill={previewArc.color}
            fillOpacity="0.35"
            stroke={previewArc.color}
            strokeDasharray="4 4"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        )}

        {interactiveMarkerAngle !== null && (
          <g>
            <line
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(((interactiveMarkerAngle - 90) * Math.PI) / 180)}
              y2={centerY + radius * Math.sin(((interactiveMarkerAngle - 90) * Math.PI) / 180)}
              stroke="#0f172a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
            <circle
              cx={centerX + radius * Math.cos(((interactiveMarkerAngle - 90) * Math.PI) / 180)}
              cy={centerY + radius * Math.sin(((interactiveMarkerAngle - 90) * Math.PI) / 180)}
              r="6"
              fill="#0f172a"
            />
          </g>
        )}

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
      {interactive && (
        <p className="text-xs text-slate-500 mt-3">Click the dial to pick a snapped start time</p>
      )}
    </div>
  );
}
