# Time example

Sends the current time over a stream.

Install dependencies, setup database, and create empty environment config:

```sh
virtualenv --python=python3 venv
. venv/bin/activate
pip install -r requirements.txt

Run the app via `uvicorn` as `uvicorn app:app`
or
```
python manage.py runserver
```

Open browser to http://localhost:8000/
