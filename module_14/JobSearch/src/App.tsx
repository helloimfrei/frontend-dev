import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LoaderCircle,
  MapPin,
  Music2,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050'

type EmploymentType = 'all' | 'fulltime' | 'parttime' | 'contract' | 'temporary'

type Job = {
  id?: string
  title: string
  company: string
  location?: string
  employmentType?: string
  postedAt?: string
  source?: string
  description: string
  applyLink: string
  match?: number
}

const employmentOptions: { label: string; value: EmploymentType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Full-time', value: 'fulltime' },
  { label: 'Part-time', value: 'parttime' },
  { label: 'Contract', value: 'contract' },
  { label: 'Temporary', value: 'temporary' },
]

const dateOptions = [
  { label: 'Any time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 3 days', value: '3days' },
  { label: 'Last week', value: 'week' },
  { label: 'Last month', value: 'month' },
]

function getJobKey(job: Job) {
  return job.id ?? `${job.company}-${job.title}`
}

function calculateMatch(resume: string, description: string) {
  if (!resume.trim() || !description.trim()) return 0

  const stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'in',
    'is',
    'of',
    'on',
    'or',
    'the',
    'to',
    'with',
    'you',
    'your',
  ])
  const resumeWords = new Set(
    resume
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2 && !stopWords.has(word)),
  )
  const descriptionWords = description
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))

  if (!descriptionWords.length) return 0

  const uniqueDescriptionWords = [...new Set(descriptionWords)]
  const matchCount = uniqueDescriptionWords.filter((word) => resumeWords.has(word)).length

  return Math.min(100, Math.round((matchCount / uniqueDescriptionWords.length) * 100))
}

function formatPostedAt(postedAt?: string) {
  if (!postedAt) return 'Recently posted'

  const date = new Date(postedAt)
  if (Number.isNaN(date.getTime())) return postedAt

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [query, setQuery] = useState('frontend developer')
  const [location, setLocation] = useState('New Jersey')
  const [country, setCountry] = useState('us')
  const [datePosted, setDatePosted] = useState('all')
  const [employmentType, setEmploymentType] = useState<EmploymentType>('all')
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [coverLetters, setCoverLetters] = useState<Record<string, string>>({})
  const [coverLetterErrors, setCoverLetterErrors] = useState<Record<string, string>>({})
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const sortedJobs = useMemo(
    () =>
      jobs
        .map((job) => ({
          ...job,
          match: calculateMatch(resumeText, job.description),
        }))
        .sort((a, b) => (b.match || 0) - (a.match || 0)),
    [jobs, resumeText],
  )

  const fetchJobs = async () => {
    setIsSearching(true)
    setSearchError('')

    try {
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        params: {
          query,
          location,
          country,
          date_posted: datePosted,
          employment_type: employmentType,
        },
      })

      const data: Job[] = response.data?.jobs || []
      setJobs(data.slice(0, 20))
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? error.message
        : 'Error fetching jobs'
      setSearchError(message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResumeUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeFile(file)
    const reader = new FileReader()
    reader.onload = () => setResumeText(reader.result as string)
    reader.readAsText(file)
  }

  const generateCoverLetter = async (job: Job) => {
    const jobKey = getJobKey(job)
    setGeneratingFor(jobKey)
    setCoverLetterErrors((prev) => ({ ...prev, [jobKey]: '' }))

    try {
      const response = await axios.post(`${API_BASE_URL}/cover-letter`, {
        resume: resumeText,
        resumeFileName: resumeFile?.name ?? '',
        ui: { query, location, country, date_posted: datePosted, employment_type: employmentType },
        job,
      })

      setCoverLetters((prev) => ({
        ...prev,
        [jobKey]: response.data?.coverLetter ?? 'No cover letter was returned.',
      }))
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error ?? error.message
        : 'Unable to generate cover letter'
      setCoverLetterErrors((prev) => ({ ...prev, [jobKey]: message }))
    } finally {
      setGeneratingFor(null)
    }
  }

  return (
    <main className="job-assistant">
      <section className="job-assistant__hero">
        <div className="job-assistant__eyebrow">
          <Music2 size={18} aria-hidden="true" />
          Job Search Assistant
        </div>
        <h1>Find roles that match your resume rhythm.</h1>
        <p>
          Search JSearch results, rank jobs by resume fit, and generate a tailored cover
          letter from the backend.
        </p>
      </section>

      <section className="job-assistant__panel" aria-label="Job search filters">
        <div className="job-assistant__form">
          <label className="job-assistant__field">
            <span>Title</span>
            <div className="job-assistant__control-wrap">
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="frontend developer"
                className="job-assistant__control"
              />
            </div>
          </label>

          <label className="job-assistant__field">
            <span>Location</span>
            <div className="job-assistant__control-wrap">
              <MapPin size={18} aria-hidden="true" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="New Jersey"
                className="job-assistant__control"
              />
            </div>
          </label>

          <label className="job-assistant__field job-assistant__field--short">
            <span>Country</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="us"
              className="job-assistant__control job-assistant__control--standalone"
            />
          </label>

          <label className="job-assistant__field">
            <span>Date posted</span>
            <select
              value={datePosted}
              onChange={(e) => setDatePosted(e.target.value)}
              className="job-assistant__control job-assistant__control--standalone"
            >
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="job-assistant__field">
            <span>Employment Type</span>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="job-assistant__control job-assistant__control--standalone"
            >
              {employmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={fetchJobs}
            className="job-assistant__submit"
            disabled={isSearching}
          >
            {isSearching ? <LoaderCircle className="spin" size={18} /> : <Search size={18} />}
            {isSearching ? 'Searching' : 'Search Jobs'}
          </button>
        </div>

        <label className="job-assistant__resume">
          <Upload size={18} aria-hidden="true" />
          <span>{resumeFile ? resumeFile.name : 'Upload resume .txt for match scoring'}</span>
          <input type="file" accept=".txt,text/plain" onChange={handleResumeUpload} />
        </label>

        {searchError ? <div className="job-assistant__error">{searchError}</div> : null}
      </section>

      <section className="job-assistant__results" aria-label="Job results">
        <div className="job-assistant__results-head">
          <div>
            <h2>{sortedJobs.length ? `${sortedJobs.length} jobs queued` : 'Ready to search'}</h2>
            <p>Upload a text resume to sort results by match score.</p>
          </div>
          <div className="job-assistant__stat">
            <Sparkles size={18} aria-hidden="true" />
            {resumeText ? 'Resume active' : 'No resume yet'}
          </div>
        </div>

        {sortedJobs.map((job, index) => {
          const jobKey = getJobKey(job)
          const isGenerating = generatingFor === jobKey

          return (
            <article key={`${jobKey}-${index}`} className="job-assistant__card">
              <div className="job-assistant__card-main">
                <div>
                  <div className="job-assistant__company">
                    <BriefcaseBusiness size={16} aria-hidden="true" />
                    {job.company || 'Company unavailable'}
                  </div>
                  <h3>{job.title || 'Untitled role'}</h3>
                  <div className="job-assistant__meta">
                    {job.location ? <span>{job.location}</span> : null}
                    {job.employmentType ? <span>{job.employmentType}</span> : null}
                    <span>
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatPostedAt(job.postedAt)}
                    </span>
                  </div>
                </div>
                <div className="job-assistant__match" aria-label={`Resume match ${job.match ?? 0}%`}>
                  <strong>{job.match ?? 0}%</strong>
                  <span>match</span>
                </div>
              </div>

              <div className="job-assistant__actions">
                {job.applyLink ? (
                  <a href={job.applyLink} target="_blank" rel="noreferrer" className="button-link">
                    Apply
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="job-assistant__muted">No apply link</span>
                )}

                <button
                  type="button"
                  onClick={() => generateCoverLetter(job)}
                  className="job-assistant__cover-letter-btn"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                  {isGenerating ? 'Generating' : 'Cover Letter'}
                </button>
              </div>

              {coverLetterErrors[jobKey] ? (
                <div className="job-assistant__error">{coverLetterErrors[jobKey]}</div>
              ) : null}

              <details className="job-assistant__details">
                <summary>Job Description</summary>
                <p>{job.description || 'No description provided.'}</p>
              </details>

              {coverLetters[jobKey] ? (
                <details className="job-assistant__cover-letter" open>
                  <summary>Cover Letter</summary>
                  <pre className="job-assistant__cover-letter-text">{coverLetters[jobKey]}</pre>
                </details>
              ) : null}
            </article>
          )
        })}
      </section>
    </main>
  )
}
