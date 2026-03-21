import json
from pathlib import Path

from django.conf import settings
from django.templatetags.static import static
from django.views.generic import TemplateView


class SpaView(TemplateView):
    template_name = "index.html"
    entrypoint = "src/main.jsx"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        asset_context = self._get_asset_context()
        context.update(asset_context)
        return context

    def _get_asset_context(self):
        manifest = self._load_manifest()
        entry = manifest.get(self.entrypoint, {})
        css_files = [static(path) for path in entry.get("css", [])]
        return {
            "entry_js": static(entry["file"]) if entry.get("file") else None,
            "entry_css": css_files,
        }

    def _load_manifest(self):
        for manifest_path in self._manifest_candidates():
            if manifest_path.is_file():
                return json.loads(manifest_path.read_text(encoding="utf-8"))
        return {}

    def _manifest_candidates(self):
        static_dirs = [Path(path) for path in getattr(settings, "STATICFILES_DIRS", [])]
        candidates = [Path(settings.STATIC_ROOT)] if getattr(settings, "STATIC_ROOT", None) else []
        candidates.extend(static_dirs)
        return [path / ".vite" / "manifest.json" for path in candidates]