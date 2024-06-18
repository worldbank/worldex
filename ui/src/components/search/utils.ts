import axios from 'axios';
import { Entity } from 'components/common/types';

// TODO: type entities
export const stripEntities = (query: string, entities: Entity[]): string => {
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

// TODO: type entities
export const prepSearchKeyword = async (entities: Entity[], query: string, skipLocation: boolean) => {
  const hasNoEntities = Array.isArray(entities) && entities.length === 0;
  let keyword;
  if (hasNoEntities) {
    // will only be used if the user skips location search
    return query;
  } else {
    let labelsToKeep = ['statistical indicator'];
    if (skipLocation) {
      // reconsider region and country entities for keyword search
      labelsToKeep = [...labelsToKeep, 'region', 'country'];
    }
    const entitiesToStrip = entities.filter((e) => !labelsToKeep.includes(e.label));
    keyword = stripEntities(query, entitiesToStrip);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/search/strip_stop_words`,
        { params: { query: keyword } },
      );
      const { tokens } = data;
      return tokens.map((t: any) => t.token).join(' ');
    } catch (err) {
      console.error(err.toJSON());
    }
  }
};

export const getDatasetsByKeyword = async (params?: any) => {
  const { data } = await axios.get(
    `${import.meta.env.VITE_API_URL}/search/keyword`,
    { params },
  );
  return data;
};
