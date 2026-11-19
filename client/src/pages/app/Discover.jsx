import { useEffect, useState } from 'react';
import { Compass, Filter, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import FounderCard from '../../components/ui/FounderCard';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/Skeleton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { userService } from '../../services/userService';
import { connectionService } from '../../services/connectionService';
import {
  AVAILABILITY,
  CATEGORIES,
  EXPERIENCE_LEVELS,
  INTERESTS,
  TECHNICAL_SKILLS,
  BUSINESS_SKILLS,
} from '../../utils/constants';

const SORTS = [
  { value: 'compatibility', label: 'Best compatibility' },
  { value: 'recent', label: 'Newest founders' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'views', label: 'Most viewed' },
];

export default function Discover() {
  useDocumentTitle('Discover founders');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState({
    industry: '',
    skill: '',
    location: '',
    category: '',
    availability: '',
    experience: '',
    sort: 'compatibility',
    saved: false,
  });
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingId, setPendingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const { data, setData, loading, error, reload } = useFetch(
    () =>
      userService.discover({
        page,
        limit: 9,
        search: debouncedSearch || undefined,
        industry: filters.industry || undefined,
        skill: filters.skill || undefined,
        location: filters.location || undefined,
        category: filters.category || undefined,
        availability: filters.availability || undefined,
        experience: filters.experience || undefined,
        sort: filters.sort,
        saved: filters.saved ? 'true' : undefined,
      }),
    [
      debouncedSearch,
      filters.industry,
      filters.skill,
      filters.location,
      filters.category,
      filters.availability,
      filters.experience,
      filters.sort,
      filters.saved,
      page,
    ]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.industry, filters.skill, filters.location, filters.category, filters.availability, filters.experience, filters.sort, filters.saved]);

  const setFilter = (key) => (value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({
      industry: '',
      skill: '',
      location: '',
      category: '',
      availability: '',
      experience: '',
      sort: 'compatibility',
      saved: false,
    });
  };

  const activeFilterCount = [
    filters.industry,
    filters.skill,
    filters.location,
    filters.category,
    filters.availability,
    filters.experience,
  ].filter(Boolean).length + (filters.saved ? 1 : 0);

  const updateFounder = (id, updates) => {
    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        users: current.users.map((user) => (user._id === id ? { ...user, ...updates } : user)),
      };
    });
  };

  const handleConnect = async (founder) => {
    if (founder.connection?.status === 'accepted') {
      toast.success('You are already connected');
      return;
    }
    if (founder.connection?.status === 'pending') {
      toast('Request already pending', { icon: '⏳' });
      return;
    }
    setPendingId(founder._id);
    try {
      const result = await connectionService.request(founder._id);
      toast.success(result.message);
      updateFounder(founder._id, {
        connection: {
          status: result.data.connection.status,
          connectionId: result.data.connection._id,
          direction: 'outgoing',
        },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const handleSave = async (founder) => {
    setSavingId(founder._id);
    try {
      const saved = await userService.toggleSave(founder._id);
      updateFounder(founder._id, { isSaved: saved });
      if (filters.saved && !saved) reload({ quiet: true });
      toast.success(saved ? 'Profile saved' : 'Removed from saved profiles');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const skillOptions = [...new Set([...TECHNICAL_SKILLS, ...BUSINESS_SKILLS])];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Discover"
        title="Find founders who fill your gaps"
        description="Browse active founders, filter by what matters, and save the profiles worth a second look."
        actions={
          <Button
            variant="secondary"
            icon={SlidersHorizontal}
            onClick={() => setFilters((current) => ({ ...current, sort: current.sort === 'compatibility' ? 'recent' : 'compatibility' }))}
          >
            Sort: {SORTS.find((sort) => sort.value === filters.sort)?.label}
          </Button>
        }
      />

      <div className="discover-toolbar">
        <Field
          icon={Search}
          placeholder="Search by name, skill, location, or bio…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="discover-search"
          aria-label="Search founders"
        />
        <Button
          variant="secondary"
          icon={Filter}
          onClick={() => setFiltersOpen((open) => !open)}
          className="filter-toggle"
        >
          Filters {activeFilterCount ? `(${activeFilterCount})` : ''}
        </Button>
      </div>

      {filtersOpen ? (
        <div className="filter-panel">
          <div className="filter-grid">
            <Field
              label="Industry"
              as="select"
              value={filters.industry}
              onChange={(event) => setFilter('industry')(event.target.value)}
              options={[{ value: '', label: 'Any industry' }, ...INTERESTS.map((i) => ({ value: i, label: i }))]}
            />
            <Field
              label="Skill"
              as="select"
              value={filters.skill}
              onChange={(event) => setFilter('skill')(event.target.value)}
              options={[{ value: '', label: 'Any skill' }, ...skillOptions.map((s) => ({ value: s, label: s }))]}
            />
            <Field
              label="Category"
              as="select"
              value={filters.category}
              onChange={(event) => setFilter('category')(event.target.value)}
              options={[{ value: '', label: 'Any category' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
            <Field
              label="Availability"
              as="select"
              value={filters.availability}
              onChange={(event) => setFilter('availability')(event.target.value)}
              options={[{ value: '', label: 'Any availability' }, ...AVAILABILITY.map((a) => ({ value: a, label: a }))]}
            />
            <Field
              label="Experience"
              as="select"
              value={filters.experience}
              onChange={(event) => setFilter('experience')(event.target.value)}
              options={[{ value: '', label: 'Any level' }, ...EXPERIENCE_LEVELS.map((e) => ({ value: e, label: e }))]}
            />
            <Field
              label="Location"
              placeholder="City or country"
              value={filters.location}
              onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
            />
            <Field
              label="Sort by"
              as="select"
              value={filters.sort}
              onChange={(event) => setFilter('sort')(event.target.value)}
              options={SORTS}
            />
            <label className="checkbox filter-checkbox">
              <input
                type="checkbox"
                checked={filters.saved}
                onChange={(event) => setFilters((current) => ({ ...current, saved: event.target.checked }))}
              />
              <span>Saved profiles only</span>
            </label>
          </div>
          <div className="filter-panel-foot">
            <button type="button" className="text-link" onClick={clearFilters}>
              <X size={14} /> Clear all filters
            </button>
            <span>{data?.meta?.total ?? 0} founders found</span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <GridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.users?.length ? (
        <EmptyState
          icon={filters.saved ? Sparkles : Compass}
          title={filters.saved ? 'No saved profiles yet' : 'No founders match these filters'}
          description={
            filters.saved
              ? 'Save profiles from Discover and they will appear here.'
              : 'Try widening your filters or clearing the search to see more founders.'
          }
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="results-meta">
            <span>
              Showing {data.users.length} of {data.meta.total} founders
            </span>
            <span className="results-sort">
              Sorted by {SORTS.find((sort) => sort.value === filters.sort)?.label.toLowerCase()}
            </span>
          </div>
          <div className="grid grid-3">
            {data.users.map((founder) => (
              <FounderCard
                key={founder._id}
                founder={founder}
                onConnect={handleConnect}
                onSave={handleSave}
                saving={savingId === founder._id || pendingId === founder._id}
              />
            ))}
          </div>
          <Pagination meta={data.meta} onChange={setPage} />
        </>
      )}
    </div>
  );
}
