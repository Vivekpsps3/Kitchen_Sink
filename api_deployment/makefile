create-venv:
	python -m venv .venv

activate-venv:
	source .venv/bin/activate

install-dependencies:
	pip install -r requirements.txt

make-dependencies:
	pip freeze > requirements.txt

deploy:
	python -m uvicorn server:app --host 0.0.0.0 --port 8000