import re

from elasticsearch_dsl import (
    Date,
    DateHistogramFacet,
    Document,
    FacetedSearch,
    GeoShape,
    Index,
    Integer,
    Keyword,
    Object,
    Q,
    TermsFacet,
    Text,
)

DOC_INDEX = 'datasets'
datasets = Index(DOC_INDEX)


class Dataset(Document):
    pg_id = Integer()
    uid = Keyword()
    name = Text(analyzer='snowball', fields={'raw': Keyword()})
    source_org = Keyword()
    last_fetched = Date()
    date_start = Date()
    date_end = Date()
    url = Keyword()
    files = Keyword(multi=True)
    accessibility = Keyword()
    description = Text(analyzer='snowball')
    projection = Keyword()
    properties = Object()
    # we have a couple bboxes whose lonlats are all the same points
    # indexing it as a GeoShape results in an error
    # `failed to parse field [bbox] of type [geo_shape]`
    bbox = Keyword()

    class Index:
        name = DOC_INDEX
        settings = {
            "number_of_shards": 2,
            # just to keep the health status green for now
            "number_of_replicas": 0,
            "highlight": {"max_analyzed_offset": 5000000},
            "max_terms_count": 262144,  # 2 ^ 18
            "refresh_interval": "30s"
        }


class DatasetFacetedSearch(FacetedSearch):
    index = DOC_INDEX
    doc_types = [Dataset]

    # fields that should be searched
    fields = ['name^5', 'description^2', 'source_org^1', 'accessibility^1', 'projection^1']

    facets = {
        'source_org': TermsFacet(field='source_org'),
        'accessibility': TermsFacet(field='accessibility'),
        'projection': TermsFacet(field='projection'),
        'date_start': DateHistogramFacet(field='date_start', calendar_interval='year'),
        'date_end': DateHistogramFacet(field='date_end', calendar_interval='year'),
    }

    def search(self):
        search = super().search()
        search = search.extra(track_total_hits=True)
        # search.params(preserve_order=True).scan()

        return search

    def query(self, search, query):
        """
        Add query part to ``search``.
        Override this if you wish to customize the query used.
        """
        shoulds = []

        if query:
            if query.startswith("adv:"):
                query = query.replace("adv:", "").strip()

                if self.fields:
                    query = Q("query_string", fields=self.fields, query=query)
                else:
                    query = Q("query_string", query=query)
            else:
                quoted_queries = re.findall(r'"(.*?)"', query)
                query = re.sub(r'"(.*?)"', "", query).strip()

                if self.fields:
                    shoulds.append(Q("multi_match", fields=self.fields, query=query))
                    shoulds.append(Q("multi_match", fields=self.fields, query=query, type="phrase", boost=2.5))
                else:
                    shoulds.append(Q("multi_match", query=query))
                    shoulds.append(Q("multi_match", query=query, type="phrase", boost=10))

                if quoted_queries:
                    for quote in quoted_queries:
                        quote = quote.strip()
                        if len(quote.split()) > 1:
                            if self.fields:
                                shoulds.append(Q("multi_match", fields=self.fields, query=quote, type="phrase", boost=5))
                            else:
                                shoulds.append(Q("multi_match", query=quote, type="phrase", boost=5))

                query = Q('bool', should=shoulds, minimum_should_match=1)

            search = search.query(query)

        return search
