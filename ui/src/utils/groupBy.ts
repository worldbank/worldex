const groupBy = <T>(arr: T[], key: keyof T): { [key: string]: T[] } => (
  arr.reduce((storage, item) => {
    const group = `${item[key]}`;
    if (storage[group]) {
      storage[group].push(item);
    } else {
      storage[group] = [item];
    }
    return storage;
  }, {} as { [key: string]: T[] })
);

export default groupBy;
