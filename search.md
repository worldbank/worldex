# Dataset Search

The dataset search heuristics can be outlined as follows

- User inputs free-form text on search bar
- Parse this raw query into entities (region, country, year, etc)
- With the location entity (or the raw query if no entities were parsed), do a location search on nominatim
    - If nominatim returns location results, go to [location search](#location-search)
- Prepare the search keyword. Assuming nominatim did not return location results at this point, the location entities will be reused as tokens for the search keyword
    - The search keyword is extracted from the raw query. At time of writing, these are the remaining tokens apart from the parsed entities and stop words
    - If there are no parsed entities, then the raw query itself is used as the keyword
- Perform a keyword search and display the dataset results

## Location Search

- If nominatim yielded location results from a raw query and the user chooses one of those, skip keyword search
- Otherwise, perform a keyword search and tag the results as candidate datasets
- If the user chooses a location to filter with, get all the datasets that intersect with the location chosen by the user
  - If there are candidate datasets, those datasets will be narrowed down into those that intersect the chosen location
- If the user skips filtering by location, the candidate datasets become the final results
- Display the dataset results