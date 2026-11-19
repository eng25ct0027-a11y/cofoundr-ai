import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Filter,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { startupService } from '../../services/startupService';
import {
  BUSINESS_SKILLS,
  INTERESTS,
  PROJECT_STAGES,
  TECHNICAL_SKILLS,
} from '../../utils/constants';
import { timeAgo, truncate } from '../../utils/formatters';

function StartupCard({ startup }) {
  const founder = startup.founderId;
  return (
    <article className="card startup-card">
      <div className="startup-card-head">
        <span className={`startup-mark stage-${startup.projectStage?.toLowerCase()}`}>
          <BriefcaseBusiness size={20} />
        </span>
        <div className="startup-card-titles">
          <h3>
            <Link to={`/startups/${startup._id}`}>{startup.title}</Link>
          </h3>
          <div className="tag-row">
            <Badge tone="soft" size="sm">
              {startup.industry}
            </Badge>
            <Badge tone="violet" size="sm">
              {startup.projectStage}
            </Badge>
            <Badge tone="neutral" size="sm">
              {startup.teamSize} {startup.teamSize === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </div>
      </div>

      <p className="startup-card-description">{truncate(startup.description, 168)}</p>

      {startup.requiredSkills?.length ? (
        <div className="startup-card-skills">
          <span className="sidebar-label">Needs</span>
          <div className="tag-row">
            {startup.requiredSkills.slice(0, 5).map((skill) => (
              <span key={skill} className="mini-tag">
                {skill}
              </span>
            ))}
            {startup.requiredSkills.length > 5 ? (
              <span className="mini-tag">+{startup.requiredSkills.length - 5}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="startup-card-foot">
        <div className="startup-founder">
          <Avatar user={founder} size={32} />
          <div>
            <strong>{founder?.name || 'Founder'}</strong>
            <span>{founder?.location || 'Remote'}</span>
          </div>
        </div>
        <div className="startup-card-actions">
          <span className="startup-card-time">{timeAgo(startup.createdAt)}</span>
          <Link to={`/startups/${startup._id}`} className="btn btn-secondary btn-sm">
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Startups() {
  useDocumentTitle('Startups');
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState({ industry: '', stage: '', skill: '', mine: false });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useFetch(
    () =>
      startupService.list({
        page,
        limit: 9,
        search: debouncedSearch || undefined,
        industry: filters.industry || undefined,
        stage: filters.stage || undefined,
        skill: filters.skill || undefined,
        mine: filters.mine ? 'true' : undefined,
      }),
    [debouncedSearch, filters.industry, filters.stage, filters.skill, filters.mine, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.industry, filters.stage, filters.skill, filters.mine]);

  const activeFilters = [filters.industry, filters.stage, filters.skill].filter(Boolean).length + (filters.mine ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setFilters({ industry: '', stage: '', skill: '', mine: false });
  };

  const skillOptions = [...new Set([...TECHNICAL_SKILLS, ...BUSINESS_SKILLS])];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Startups"
        title="Ideas looking for their missing piece"
        description="Browse published startups, see who is building, and apply to join a team that needs exactly what you bring."
        actions={
          <Link to="/startups/new" className="btn btn-primary btn-md">
            <Plus size={16} /> Post a startup
          </Link>
        }
      />

      <div className="discover-toolbar">
        <Field
          icon={Search}
          placeholder="Search startups by title, problem, or industry…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="discover-search"
          aria-label="Search startups"
        />
        <Button
          variant="secondary"
          icon={Filter}
          onClick={() => setFiltersOpen((open) => !open)}
          className="filter-toggle"
        >
          Filters {activeFilters ? `(${activeFilters})` : ''}
        </Button>
      </div>

      {filtersOpen ? (
        <div className="filter-panel">
          <div className="filter-grid">
            <Field
              label="Industry"
              as="select"
              value={filters.industry}
              onChange={(event) => setFilters((current) => ({ ...current, industry: event.target.value }))}
              options={[{ value: '', label: 'Any industry' }, ...INTERESTS.map((i) => ({ value: i, label: i }))]}
            />
            <Field
              label="Stage"
              as="select"
              value={filters.stage}
              onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))}
              options={[{ value: '', label: 'Any stage' }, ...PROJECT_STAGES.map((s) => ({ value: s, label: s }))]}
            />
            <Field
              label="Skill needed"
              as="select"
              value={filters.skill}
              onChange={(event) => setFilters((current) => ({ ...current, skill: event.target.value }))}
              options={[{ value: '', label: 'Any skill' }, ...skillOptions.map((s) => ({ value: s, label: s }))]}
            />
            <label className="checkbox filter-checkbox">
              <input
                type="checkbox"
                checked={filters.mine}
                onChange={(event) => setFilters((current) => ({ ...current, mine: event.target.checked }))}
              />
              <span>Only my startups</span>
            </label>
          </div>
          <div className="filter-panel-foot">
            <button type="button" className="text-link" onClick={clearFilters}>
              <X size={14} /> Clear all filters
            </button>
            <span>{data?.meta?.total ?? 0} startups found</span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <GridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.startups?.length ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={filters.mine ? 'You have not posted a startup yet' : 'No startups match these filters'}
          description={
            filters.mine
              ? 'Publish your idea so founders can discover it and apply to join you.'
              : 'Try clearing the filters or check back soon for new ideas.'
          }
          action={
            filters.mine ? (
              <Link to="/startups/new" className="btn btn-primary btn-sm">
                <Plus size={15} /> Post a startup
              </Link>
            ) : (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="results-meta">
            <span>
              Showing {data.startups.length} of {data.meta.total} startups
            </span>
            <span className="results-sort">
              <Users size={14} /> Newest ideas first
            </span>
          </div>
          <div className="grid grid-3">
            {data.startups.map((startup) => (
              <StartupCard key={startup._id} startup={startup} />
            ))}
          </div>
          <Pagination meta={data.meta} onChange={setPage} />
        </>
      )}

      <section className="panel startups-callout">
        <div className="startups-callout-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <h2>Building something? Put it in front of the right founders.</h2>
          <p>
            Publishing a startup lets the engine recommend founders whose skills match the roles you
            need — and lets them apply directly to you.
          </p>
        </div>
        <Link to="/startups/new" className="btn btn-primary btn-md">
          <Plus size={16} /> Post your startup
        </Link>
      </section>
    </div>
  );
}
