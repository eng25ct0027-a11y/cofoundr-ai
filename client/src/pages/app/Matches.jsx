import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Pagination from '../../components/ui/Pagination';
import ScoreRing from '../../components/ui/ScoreRing';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/Skeleton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { matchService } from '../../services/matchService';
import { connectionService } from '../../services/connectionService';
import { AVAILABILITY, INTERESTS, MATCH_FACTORS } from '../../utils/constants';

function MatchCard({ match, onConnect, onOpenDetails, connecting }) {
  const profile = match.user;
  const breakdown = match.breakdown || {};

  return (
    <article className="card match-card-item">
      <div className="match-card-top">
        <Avatar user={profile} size={56} />
        <div className="match-card-identity">
          <h3>
            <Link to={`/profile/${profile._id}`}>{profile.name}</Link>
          </h3>
          <p>
            {profile.category || 'Founder'}
            {profile.location ? ` · ${profile.location}` : ''}
          </p>
          <div className="tag-row">
            {profile.availability ? <Badge tone="violet" size="sm">{profile.availability}</Badge> : null}
            {profile.experienceLevel ? <Badge tone="neutral" size="sm">{profile.experienceLevel}</Badge> : null}
            {match.source === 'llm' ? <Badge tone="blue" size="sm">LLM enhanced</Badge> : null}
          </div>
        </div>
        <ScoreRing score={match.compatibilityScore} size={68} stroke={7} />
      </div>

      {profile.bio ? <p className="match-bio">{profile.bio}</p> : null}

      <div className="match-reasons">
        {(match.matchingReasons || []).map((reason) => (
          <p key={reason}>
            <Sparkles size={14} /> {reason}
          </p>
        ))}
      </div>

      <div className="match-factor-mini">
        {MATCH_FACTORS.map((factor) => (
          <div key={factor.key} className="match-factor-mini-row">
            <span>{factor.label}</span>
            <span className="match-mini-track">
              <span style={{ width: `${breakdown[factor.key] ?? 0}%` }} />
            </span>
            <strong>{breakdown[factor.key] ?? 0}</strong>
          </div>
        ))}
      </div>

      <div className="match-card-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onOpenDetails(match)}
        >
          <ChevronDown size={15} /> Full breakdown
        </button>
        <div className="match-card-actions-right">
          <Link to={`/profile/${profile._id}`} className="btn btn-secondary btn-sm">
            View profile
          </Link>
          {match.connection?.status === 'accepted' ? (
            <Link to="/chat" className="btn btn-primary btn-sm">
              Message
            </Link>
          ) : (
            <Button
              size="sm"
              loading={connecting}
              disabled={match.connection?.status === 'pending'}
              onClick={() => onConnect(match)}
            >
              {match.connection?.status === 'pending' ? 'Request pending' : 'Connect'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Matches() {
  useDocumentTitle('AI matches');
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState({ industry: '', availability: '', minScore: 0, sort: 'score' });
  const [page, setPage] = useState(1);
  const [recalculating, setRecalculating] = useState(false);
  const [connectingId, setConnectingId] = useState(null);
  const [details, setDetails] = useState(null);

  const { data, setData, loading, error, reload } = useFetch(
    () =>
      matchService.list({
        page,
        limit: 6,
        search: debouncedSearch || undefined,
        industry: filters.industry || undefined,
        availability: filters.availability || undefined,
        minScore: filters.minScore || undefined,
        sort: filters.sort,
      }),
    [debouncedSearch, filters.industry, filters.availability, filters.minScore, filters.sort, page]
  );

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const result = await matchService.recalculate();
      setData(result);
      setPage(1);
      toast.success(result.matches.length ? `Recalculated — ${result.matches.length} matches found` : 'No matches yet. Add more profile detail.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleConnect = async (match) => {
    setConnectingId(match._id);
    try {
      const result = await connectionService.request(match.user._id);
      toast.success(result.message);
      setData((current) => ({
        ...current,
        matches: current.matches.map((item) =>
          item._id === match._id
            ? {
                ...item,
                connection: {
                  status: result.data.connection.status,
                  connectionId: result.data.connection._id,
                  direction: 'outgoing',
                },
              }
            : item
        ),
      }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConnectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <PageHeader eyebrow="AI matches" title="Your compatibility matches" />
        <GridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="AI matches"
        title="Founders ranked by real compatibility"
        description="Every score is computed from seven weighted factors. Recalculate any time your profile changes."
        actions={
          <Button icon={RefreshCw} onClick={recalculate} loading={recalculating}>
            Recalculate matches
          </Button>
        }
      />

      {!user?.onboardingCompleted ? (
        <div className="inline-banner">
          <span>Complete onboarding to unlock the matching engine.</span>
          <Link to="/onboarding" className="text-link">
            Complete profile →
          </Link>
        </div>
      ) : null}

      <div className="matches-toolbar">
        <Field
          icon={Search}
          placeholder="Search matches by name, skill, or bio…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="discover-search"
          aria-label="Search matches"
        />
        <div className="matches-filters">
          <Field
            as="select"
            value={filters.industry}
            onChange={(event) => setFilters((current) => ({ ...current, industry: event.target.value }))}
            options={[{ value: '', label: 'Any industry' }, ...INTERESTS.map((i) => ({ value: i, label: i }))]}
            aria-label="Filter by industry"
          />
          <Field
            as="select"
            value={filters.availability}
            onChange={(event) => setFilters((current) => ({ ...current, availability: event.target.value }))}
            options={[{ value: '', label: 'Any availability' }, ...AVAILABILITY.map((a) => ({ value: a, label: a }))]}
            aria-label="Filter by availability"
          />
          <Field
            as="select"
            value={filters.minScore}
            onChange={(event) => setFilters((current) => ({ ...current, minScore: Number(event.target.value) }))}
            options={[
              { value: 0, label: 'Any score' },
              { value: 70, label: '70% or higher' },
              { value: 80, label: '80% or higher' },
              { value: 90, label: '90% or higher' },
            ]}
            aria-label="Minimum score"
          />
          <Field
            as="select"
            value={filters.sort}
            onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
            options={[
              { value: 'score', label: 'Highest score' },
              { value: 'recent', label: 'Newest first' },
            ]}
            aria-label="Sort matches"
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.matches?.length ? (
        <EmptyState
          icon={BrainCircuit}
          title="No matches to show yet"
          description={
            user?.onboardingCompleted
              ? 'Try clearing filters or recalculate to refresh the engine.'
              : 'Complete onboarding so the engine can score your compatibility.'
          }
          action={
            user?.onboardingCompleted ? (
              <Button icon={RefreshCw} onClick={recalculate} loading={recalculating}>
                Recalculate matches
              </Button>
            ) : (
              <Link to="/onboarding" className="btn btn-primary btn-sm">
                Complete onboarding
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="results-meta">
            <span>Showing {data.matches.length} of {data.meta.total} matches</span>
            <span className="results-sort">
              <Users size={14} /> Weighted by complementary skills, goals, and working style
            </span>
          </div>

          <div className="match-list">
            {data.matches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                onConnect={handleConnect}
                onOpenDetails={setDetails}
                connecting={connectingId === match._id}
              />
            ))}
          </div>

          <Pagination meta={data.meta} onChange={setPage} />
        </>
      )}

      {details ? (
        <div className="match-details-panel">
          <div className="match-details-head">
            <div>
              <span className="page-eyebrow">Breakdown</span>
              <h2>{details.user.name}</h2>
              <p>How each weighted factor contributes to the overall score.</p>
            </div>
            <div className="match-details-actions">
              <ScoreRing score={details.compatibilityScore} size={64} stroke={6} />
              <button type="button" className="icon-btn" onClick={() => setDetails(null)} aria-label="Close breakdown">
                ×
              </button>
            </div>
          </div>

          <div className="match-details-grid">
            {MATCH_FACTORS.map((factor) => {
              const value = details.breakdown?.[factor.key] ?? 0;
              const contribution = Math.round((value / 100) * factor.weight * 10) / 10;
              return (
                <div key={factor.key} className="match-detail-row">
                  <div className="match-detail-info">
                    <span>{factor.label}</span>
                    <small>{factor.weight}% weight · +{contribution} pts</small>
                  </div>
                  <div className="match-detail-track">
                    <span style={{ width: `${value}%` }} />
                  </div>
                  <strong>{value}</strong>
                </div>
              );
            })}
          </div>

          <div className="match-details-reasons">
            <h3>Why this match</h3>
            {(details.matchingReasons || []).map((reason) => (
              <p key={reason}>
                <Sparkles size={15} /> {reason}
              </p>
            ))}
          </div>

          <div className="match-details-foot">
            <span>
              Score is computed live. Source: <strong>{details.source}</strong>
            </span>
            <Link to={`/profile/${details.user._id}`} className="btn btn-primary btn-sm">
              View full profile <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
