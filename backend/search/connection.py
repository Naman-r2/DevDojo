from elasticsearch import Elasticsearch
from elasticsearch_dsl import connections

ES_URL = "http://localhost:9200"

# Clients
es = Elasticsearch(ES_URL)
connections.create_connection(hosts=[ES_URL])

# Don’t check on import – let FastAPI lifecycle handle it
