const setIntervalAsync = (fn, ms) => {
  fn().then(() => {
    setTimeout(() => setIntervalAsync(fn, ms), ms);
  });
};

const inRange = function (num, start, end) {
  // If no end number, use start as end
  if (!end) {
    end = start;
    start = 0;
  }

  return num >= start && num <= end;
};

module.exports = {
  setIntervalAsync,
  inRange,
};
