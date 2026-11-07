import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  RatingProfile,
  TourRating,
  ratingAverage,
} from '../../services/tours/ratings';

type Tour = { id: string; name: string };
const API = '/api/kletterglueck/ratings';
export const useFamilyRatings = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<RatingProfile>('Simon');
  const [tours, setTours] = useState<Tour[]>([]);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState('');
  const [currentTour, setCurrentTour] = useState<Tour>();
  const [ratings, setRatings] = useState<TourRating[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const [visited, setVisited] = useState(false);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const catalogRequest = useRef<AbortController>();

  const osm = typeof router.query.osm === 'string' ? router.query.osm : '';
  const initial =
    typeof router.query.tour === 'string' ? router.query.tour : '';

  useEffect(() => {
    if (initial) setSelected(initial);
  }, [initial]);

  const list = useCallback(
    async (after?: string) => {
      catalogRequest.current?.abort();
      const controller = new AbortController();
      catalogRequest.current = controller;
      setError('');
      setCatalogLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (osm) params.set('osm', osm);
        if (after) params.set('after', after);
        const response = await fetch(API + '?' + params, {
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.error || 'Touren konnten nicht geladen werden.',
          );
        if (controller.signal.aborted) return;
        setTours((previous) =>
          after ? [...previous, ...result.tours] : result.tours,
        );
        setCursor(result.next);
        if (!result.tours.length)
          setNotice(
            'Keine Tour gefunden. Die Tour muss zuerst im zentralen Katalog gespeichert sein.',
          );
        else setNotice('');
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    },
    [osm, query],
  );

  useEffect(() => {
    const timer = setTimeout(() => void list(), 300);
    return () => {
      clearTimeout(timer);
      catalogRequest.current?.abort();
    };
  }, [list]);

  useEffect(() => {
    const controller = new AbortController();
    if (!selected) {
      setCurrentTour(undefined);
      setRatings([]);
      return () => controller.abort();
    }
    setError('');
    setLoading(true);
    fetch(API + '?tour=' + encodeURIComponent(selected), {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.error || 'Bewertungen konnten nicht geladen werden.',
          );
        if (!controller.signal.aborted) {
          setCurrentTour(result.tour);
          setRatings(result.ratings);
          setNotice('');
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selected]);

  useEffect(() => {
    const mine = ratings.find((entry) => entry.profile === profile);
    setStars(mine?.stars ?? null);
    setVisited(mine?.visited ?? false);
    setDate(mine?.visited_at ?? '');
    setNote(mine?.note ?? '');
  }, [ratings, profile]);

  const save = async (remove = false) => {
    if (!currentTour || loading || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    const entry: TourRating = {
      tour_id: currentTour.id,
      profile,
      stars,
      visited,
      visited_at: visited && date ? date : null,
      note,
    };
    try {
      const response = await fetch(API, {
        method: remove ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || 'Speichern fehlgeschlagen.');
      setRatings((previous) => [
        ...previous.filter((entry) => entry.profile !== profile),
        ...(remove ? [] : [entry]),
      ]);
      setNotice(
        remove
          ? 'Deine Bewertung wurde entfernt.'
          : 'Bewertung für beide Geräte gespeichert.',
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  const busy = loading || saving;
  const average = ratingAverage(ratings);
  const options =
    currentTour && !tours.some((tour) => tour.id === currentTour.id)
      ? [currentTour, ...tours]
      : tours;

  return {
    profile,
    setProfile,
    query,
    setQuery,
    selected,
    setSelected,
    currentTour,
    setCurrentTour,
    ratings,
    stars,
    setStars,
    visited,
    setVisited,
    date,
    setDate,
    note,
    setNote,
    error,
    notice,
    cursor,
    catalogLoading,
    busy,
    average,
    options,
    list,
    save,
  };
};
