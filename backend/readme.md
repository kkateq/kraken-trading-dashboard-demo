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
python app.py
```

Open browser to http://localhost:8000/


#Code samples

1. Count execution time
```

            start_time = time.perf_counter()
           <!-- executed code -->
            end_time = time.perf_counter()
            print("{} SECONDS".format(end_time - start_time))
```