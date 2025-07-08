
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
    <div className="text-white">
      <span className="fw-bold">{time.toLocaleTimeString()}</span>
      <span className="ms-2 fw-bold">{timeZone}</span>
    </div>
  );
};

export default Clock;
