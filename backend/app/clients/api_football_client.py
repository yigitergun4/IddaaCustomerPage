"""
HTTP client for the API-Football (api-sports.io) service.

Responsibilities (Single Responsibility Principle):
  - Inject the required authentication header on every request.
  - Execute raw HTTP calls and surface structured errors.
  - Own no business logic whatsoever.

All network I/O is asynchronous via `httpx.AsyncClient`.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class APIFootballError(Exception):
    """Raised when API-Football returns a non-2xx status or a network error occurs."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class APIFootballClient:
    """
    Thin async HTTP wrapper around API-Football v3.

    Usage (as an async context manager):
        async with APIFootballClient() as client:
            data = await client.get("/fixtures", params={"league": 203, "date": "2024-01-01"})
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._base_url: str = settings.api_football_base_url
        self._headers: dict[str, str] = {
            "x-apisports-key": settings.api_football_key,
            "Accept": "application/json",
        }
        self._client: httpx.AsyncClient | None = None

    # ------------------------------------------------------------------
    # Context-manager helpers (allows `async with APIFootballClient()`)
    # ------------------------------------------------------------------

    async def __aenter__(self) -> "APIFootballClient":
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._headers,
            timeout=httpx.Timeout(30.0),
        )
        return self

    async def __aexit__(self, *_: Any) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    async def get(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        Perform a GET request against *endpoint* and return the parsed JSON body.

        Args:
            endpoint: Path relative to the base URL (e.g. ``"/fixtures"``).
            params:   Optional query-string parameters.

        Returns:
            The full parsed JSON response as a dictionary.

        Raises:
            APIFootballError: On HTTP 4xx/5xx responses or network failures.
            RuntimeError:     If called outside of the async context manager.
        """
        if self._client is None:
            raise RuntimeError(
                "APIFootballClient must be used as an async context manager. "
                "Use `async with APIFootballClient() as client:`."
            )

        logger.debug("GET %s | params=%s", endpoint, params)

        try:
            response = await self._client.get(endpoint, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "API-Football HTTP error: %s %s",
                exc.response.status_code,
                exc.response.text[:200],
            )
            raise APIFootballError(
                f"API-Football returned HTTP {exc.response.status_code}: {exc.response.text[:200]}",
                status_code=exc.response.status_code,
            ) from exc
        except httpx.RequestError as exc:
            logger.error("API-Football network error: %s", exc)
            raise APIFootballError(f"Network error while contacting API-Football: {exc}") from exc

        payload: dict[str, Any] = response.json()

        # API-Football wraps errors in a payload even on 200 responses sometimes
        api_errors: list[Any] = payload.get("errors", [])
        if api_errors:
            logger.warning("API-Football errors in payload: %s", api_errors)

        logger.debug(
            "API-Football: %d results fetched from %s",
            payload.get("results", 0),
            endpoint,
        )
        return payload
