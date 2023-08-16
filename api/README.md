This FastAPI app runs on Python 3.11 - there is an issue with pydantic on Python 3.10 https://github.com/pydantic/pydantic/discussions/6244

If you wish to run this app locally outside of docker-compose for whatever reason, I recommend the use of [pyenv](https://github.com/pyenv/pyenv) to switch Python version into 3.11.

From within the project or api root
```
pyenv install 3.11.4
pyenv local 3.11.4
```