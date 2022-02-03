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

function callWithTimeout(func, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeout)
    func().then(
      response => resolve(response),
      err => reject(new Error(err))
    ).finally(() => clearTimeout(timer))
  })
}

module.exports = {
  setIntervalAsync,
  inRange,
  callWithTimeout
};
