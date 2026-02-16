export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const groupPassagesAndChildren = (items) => {
  const byId = new Map();
  const passageOrder = [];

  items.forEach((q) => {
    if (!q || !q._id) return;
    byId.set(q._id.toString(), q);
    if (q.questionType === "passage" || q.isPassage) {
      passageOrder.push(q._id.toString());
    }
  });

  const used = new Set();
  const result = [];

  for (const pid of passageOrder) {
    const passage = byId.get(pid);
    if (!passage || used.has(pid)) continue;
    result.push(passage);
    used.add(pid);
    items.forEach((q) => {
      const qid = q._id?.toString();
      if (qid && !used.has(qid) && q.parentQuestionId && q.parentQuestionId.toString() === pid) {
        result.push(q);
        used.add(qid);
      }
    });
  }

  items.forEach((q) => {
    const qid = q._id?.toString();
    if (qid && !used.has(qid)) {
      result.push(q);
      used.add(qid);
    }
  });

  return result;
};