import { Modal } from '@mui/material';
import ReactMarkdown from 'react-markdown';

const markdown = `
# WorldEx: Indexing the World for Subnational Data Discoverability

## Background

Geospatial data has proven invaluable for providing localized information crucial to various development and economic research initiatives. These research activities are essential as they ultimately guide policymaking to address a multitude of socio-economic issues effectively. However, a significant challenge limiting the extensive use and reuse of geospatial data is the fragmentation and siloing of data across disparate data sources. This fragmentation creates a substantial hurdle, impeding the efficient utilization of geospatial data for research and other practical applications.

One of the main issues researchers face is the tremendous overhead involved in stocktaking available data for a specific geography. This process slows down both the scoping and initiation phases of research. Often, researchers might rely on previously utilized data, leading to the same datasets being repeatedly used in successive studies despite more relevant yet less popular data being available elsewhere. Additionally, data usage is frequently influenced by &quot;social networks,&quot; wherein researchers use data previously used by their peers or acquaintances. This reliance on familiar datasets means that some potentially more appropriate and recent data remain underutilized simply because they are not easily discoverable, less popular, or new.

## Vision and Value Proposition

We created WorldEx to showcase a solution for the data discoverability of socio-economic geospatial data, especially those with sub-national coverage. The vision is for catalogs to adopt solutions that WorldEx has to help significantly accelerate the process of geospatial data stocktaking.

One of WorldEx’s key value propositions is its unique approach to data indexing. WorldEx does not host any geospatial data directly, similar to traditional data catalogs. However, it can still provide accurate data coverage information by allowing data owners to generate H3 indices of their data and submit it to WorldEx together with metadata. This federated framework is particularly advantageous for data catalogs that require users to request permission before accessing data. By not hosting data, WorldEx eliminates the need for cumbersome data duplication and storage, focusing instead on enhancing data discoverability and accessibility.

Essentially, WorldEx demonstrates the feasibility of how a geospatially-aware data gateway can function, enabling users to seamlessly navigate and access various data catalogs containing the actual geospatial datasets. This gateway bridges disparate geospatial data silos, providing users with a comprehensive and unified view of data availability across different geospatial levels. This holistic perspective empowers users to make more informed decisions, fostering greater efficiency and effectiveness in finding data for their research and analyses for policy-making efforts.

## What WorldEx is Not

Before we dive into the details of WorldEx, it is essential to clarify what WorldEx is not.

- WorldEx is not a data repository. It does not store any geospatial data. Instead, it indexes the H3 indices of geospatial data and metadata from various data catalogs.
- WorldEx also does not attempt to augment or modify the metadata of the indexed data. It merely stores the metadata accessed from the catalogs where the data is hosted.
- WorldEx does not provide data access. It only provides information on the availability of data and metadata. It is up to the user to access the data from the respective data catalogs.
- WorldEx is not a "data catalog". It is a proof-of-concept to how subnational data discovery can be reimagined using H3 indexing augmented with simple keyword search and filtering capabilities.

## How WorldEx works

This section outlines the project flow and contains technical information, including the technology stack, components, and other details.

### The Flow

We can break down WorldEx into three main components or steps.

1. H3 index generation

   This component uses the worldex Python package to generate H3 indices for geospatial data. At this stage, metadata must be included in the generated H3 indices. See [documentation](https://avsolatorio.github.io/worldex/) for details.

   It is essential to highlight that this step can be decentralized. Using our library, data catalogs can process and generate H3 indices for their data, ensuring that their data does not leave their repositories. This decentralization is critical for data that are not publicly available.

2. Data indexing

   Once the H3 indices and the metadata for geospatial data have been generated, they can be loaded into the WorldEx database. This process stores the indices from various catalogs into a single database, allowing users to stock take available data easily.

3. WorldEx application

   The WorldEx application serves as an interface for users to interact easily with the available data. It is feature-rich, allowing geographic search, filtering, and visualization of data extent and coverage.

   Due to the scale, amounting to billions of H3 indices, various optimizations have been implemented to ensure that the application can quickly discover the indexed datasets.

## Development Relevance

H3 indexing has been gaining momentum in various geospatial data applications.

For example, the World Bank’s Geospatial Operations Support Team (GOST) is leading a project, [Space2Stats](https://worldbank.github.io/DECAT_Space2Stats), to make spatially and temporally comparable data using H3-based aggregation. Because of WorldEx's H3-native support, this project’s output can easily be integrated into the application, disseminated, and made discoverable.

## Technologies

WorldEx leverages well-known and trusted open-sourced technologies. It uses Python, [H3](https://h3geo.org/docs/highlights/indexing/) from Uber, [Nominatim](https://nominatim.org/) from OpenStreetMap, [PostgreSQL](https://www.postgresql.org/) (with [PostGIS](https://postgis.net/)), [ElasticSearch](https://postgis.net/), and [Qdrant](https://qdrant.tech/).

## Team
- [Renzo Gabriel Bongocan](https://www.linkedin.com/in/renzo-bongocan/): Lead Developer
- [Joseph Thomas Miclat](https://www.linkedin.com/in/jtmiclat/): Geospatial Data Engineer
- [Aivin V. Solatorio](https://www.linkedin.com/in/avsolatorio/): Project Lead
- [Olivier Dupriez](https://www.linkedin.com/in/olivier-dupriez-5285ab1b8): Advisor

## Acknowledgment
The development of WorldEx has been funded by the Knowledge for Change program (KCP IV) of the World Bank. Project name: (P180150) _Indexing the World: Enabling the effective and efficient discovery of geospatial data for holistic and localized research)_, KCP IV - TF085237

The funding received contributions from the following donors: The Sweden International Development Cooperation Agency (Sida), Agence Française de Développement (AFD), Government of Japan, and the European Union.
`;

export default function AboutModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="
        absolute
        bg-white
        top-1/2
        left-1/2
        transform
        -translate-x-1/2
        -translate-y-1/2
        max-h-[80vh]
        overflow-y-scroll
        p-6
        rounded-md"
      >
        <article className="prose">
          <ReactMarkdown>
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </Modal>
  );
}
