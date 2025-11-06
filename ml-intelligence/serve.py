import os
import sys
import types
import importlib.util
import uvicorn


def load_app():
    """Load FastAPI `app` from ml-intelligence/app.py ensuring package context for relative imports."""
    here = os.path.dirname(__file__)

    # Create a synthetic package name without hyphen so relative imports work
    pkg_name = "ml_intelligence"
    pkg = types.ModuleType(pkg_name)
    pkg.__path__ = [here]
    pkg.__file__ = os.path.join(here, "__init__.py")
    sys.modules[pkg_name] = pkg

    # Load submodule app within the synthetic package context
    app_path = os.path.join(here, "app.py")
    spec = importlib.util.spec_from_file_location(f"{pkg_name}.app", app_path, submodule_search_locations=[here])
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[f"{pkg_name}.app"] = mod
    spec.loader.exec_module(mod)
    return mod.app


if __name__ == "__main__":
    app = load_app()
    host = os.environ.get("ML_HOST", "127.0.0.1")
    port = int(os.environ.get("ML_PORT", "8001"))
    # Run without reload because we are passing the app object directly
    uvicorn.run(app, host=host, port=port)