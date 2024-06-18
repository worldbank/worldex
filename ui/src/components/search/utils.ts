import axios from 'axios';
import { Entity } from 'components/common/types';

const stripEntities = (query: string, entities: Entity[]): string => {
  if (!Array.isArray(entities) || entities.length === 0) {
    return query;
  }
  const strippedQ = entities.reduce((acc, entity, idx, arr) => {
    const prevEntity = arr[idx - 1];
    const nextEntity = arr[idx + 1];
    acc += prevEntity ? query.slice(prevEntity.end, entity.start) : query.slice(0, entity.start);
    acc += !nextEntity ? query.slice(entity.end) : '';
    return acc;
  }, '');
  return strippedQ.trim();
};

export const prepSearchKeyword = async (query: string, entities: Entity[], labelsToKeep: string[]) => {
  const entitiesToStrip = entities.filter((e) => !labelsToKeep.includes(e.label));
  const stripped = stripEntities(query, entitiesToStrip);
  try {
    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/search/strip_stop_words`,
      { params: { query: stripped } },
    );
    const { tokens } = data;
    return tokens.map((t: any) => t.token).join(' ');
  } catch (err) {
    console.error(err.toJSON());
  }
};

export const getDatasetsByKeyword = async (params: any) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_API_URL}/search/keyword`,
    { params },
  );
  return data;
};
