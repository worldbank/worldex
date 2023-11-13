const groupBy = <T>(arr: T[], key: keyof T): { [key: string]: T[] } => (
  arr.reduce((storage, item: T) => {
    const group = String(item[key]);
    storage[group] = storage[group] ? storage[group].concat([item]) : [item];
    return storage;
  }, {} as { [key: string]: T[] })
);

export default groupBy;
