import 'dotenv/config'
import express from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5050
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

const employmentTypeMap = {
  fulltime: 'FULLTIME',
  parttime: 'PARTTIME',
  contract: 'CONTRACTOR',
  temporary: 'TEMPORARY',
}

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

function buildJSearchQuery({ query, location }) {
  const q = (query ?? '').toString().trim()
  const loc = (location ?? '').toString().trim()

  if (!q && !loc) return ''
  if (q && !loc) return q
  if (!q && loc) return `jobs in ${loc}`

  return `${q} jobs in ${loc}`
}

function normalizeEmploymentType(value) {
  const key = (value ?? 'all').toString().toLowerCase()
  if (!key || key === 'all') return ''
  return employmentTypeMap[key] ?? key.toUpperCase()
}

function matchesEmploymentType(job, employmentType) {
  const selected = normalizeEmploymentType(employmentType)
  if (!selected) return true

  const rawType = `${job.employmentType ?? ''}`.toUpperCase()
  if (selected === 'CONTRACTOR') return rawType.includes('CONTRACT')
  if (selected === 'TEMPORARY') return rawType.includes('TEMP')

  return rawType.includes(selected.replace('TIME', '')) || rawType.includes(selected)
}

function extractOpenAIText(data) {
  if (typeof data?.output_text === 'string') return data.output_text

  const messages = data?.output ?? []
  for (const message of messages) {
    const content = message?.content ?? []
    const text = content
      .map((item) => item?.text ?? '')
      .filter(Boolean)
      .join('\n')

    if (text) return text
  }

  return ''
}

function createLocalCoverLetter({ resume, job }) {
  const candidateSignal = resume
    ? 'My background aligns with the role through the skills and project experience highlighted in my resume.'
    : 'I am excited to bring a focused, adaptable approach to this role.'

  return `Dear Hiring Manager,

I am writing to apply for the ${job.title || 'open role'} position at ${job.company || 'your company'}. ${candidateSignal}

What stands out to me about this opportunity is the chance to contribute to work that requires strong problem solving, clear communication, and consistent follow-through. Based on the job description, I would bring relevant technical judgment, attention to detail, and a practical approach to delivering reliable results.

I would welcome the opportunity to discuss how my experience can support ${job.company || 'your team'}.

Sincerely,
Your Name`
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/jobs', async (req, res) => {
  try {
    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ error: 'Missing RAPIDAPI_KEY in backend/.env' })
    }

    const {
      query,
      location,
      page = '1',
      num_pages = '1',
      country = 'us',
      date_posted = 'all',
      employment_type = 'all',
    } = req.query

    const builtQuery = buildJSearchQuery({ query, location })
    if (!builtQuery) {
      return res.status(400).json({ error: 'Please provide query and/or location' })
    }

    const employmentTypes = normalizeEmploymentType(employment_type)
    const params = {
      query: builtQuery,
      page,
      num_pages,
      country,
      date_posted,
    }

    if (employmentTypes) {
      params.employment_types = employmentTypes
    }

    const response = await axios.get(`https://${RAPIDAPI_HOST}/search`, {
      params,
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    })

    const rawJobs = response?.data?.data ?? []
    const jobs = rawJobs
      .map((j) => ({
        id: j.job_id ?? j.job_apply_link ?? `${j.employer_name ?? ''}-${j.job_title ?? ''}`,
        title: j.job_title ?? '',
        company: j.employer_name ?? '',
        location:
          j.job_city || j.job_state || j.job_country
            ? [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ')
            : j.job_location ?? '',
        employmentType: j.job_employment_type ?? '',
        postedAt: j.job_posted_at_datetime_utc ?? j.job_posted_at_timestamp ?? '',
        description: j.job_description ?? '',
        applyLink: j.job_apply_link ?? j.job_google_link ?? '',
        source: j.job_publisher ?? '',
      }))
      .filter((job) => matchesEmploymentType(job, employment_type))

    res.json({
      query: {
        query: builtQuery,
        page: Number(page),
        num_pages: Number(num_pages),
        country,
        date_posted,
        employment_type,
        employment_types: employmentTypes,
      },
      jobs,
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      const message =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : error.message

      console.error('JSearch request failed:', status, message)
      return res.status(status).json({
        error: 'Failed to fetch jobs',
        upstream: { status, message },
      })
    }

    console.error(error)
    res.status(500).json({ error: 'Failed to fetch jobs' })
  }
})

app.post('/cover-letter', async (req, res) => {
  try {
    const { resume = '', job = {}, ui = {} } = req.body ?? {}

    if (!job.title || !job.company) {
      return res.status(400).json({ error: 'Missing job title or company' })
    }

    if (!OPENAI_API_KEY) {
      return res.json({
        provider: 'local-fallback',
        coverLetter: createLocalCoverLetter({ resume, job }),
      })
    }

    const input = `Create a concise, professional cover letter.

Search context:
${JSON.stringify(ui, null, 2)}

Resume text:
${resume || 'No resume text was provided.'}

Job:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location ?? 'Not specified'}
Employment type: ${job.employmentType ?? 'Not specified'}
Description:
${job.description ?? 'No description provided.'}

Keep it under 280 words. Do not invent specific credentials that are not present in the resume.`

    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: OPENAI_MODEL,
        input,
        temperature: 0.5,
        max_output_tokens: 520,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const coverLetter = extractOpenAIText(response.data)
    if (!coverLetter) {
      return res.status(502).json({ error: 'Cover letter API returned no text' })
    }

    res.json({ provider: 'openai', coverLetter })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500
      const message =
        typeof error.response?.data?.error?.message === 'string'
          ? error.response.data.error.message
          : error.message

      console.error('Cover letter request failed:', status, message)
      return res.status(status).json({ error: 'Failed to generate cover letter', upstream: message })
    }

    console.error(error)
    res.status(500).json({ error: 'Failed to generate cover letter' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
