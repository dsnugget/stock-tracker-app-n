
import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const timeZone = time.toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2]

  return (
    <div className="modern-clock">
      <span className="time-display">{time.toLocaleTimeString()}</span>
      <span className="timezone-display">{timeZone}</span>
    </div>
  );
};

export default Clock;
