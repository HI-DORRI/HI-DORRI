import { apiFetch } from './api'

export type HomeData = {
  user: { id: string; name: string; profileImageUrl: string | null }
  wallet: { xrplAddress: string; network: string } | null
  dorri: { balance: string; trustLineStatus: string } | null
  myMeetups: Array<{
    applicationId: string
    status: string
    lockedDorriAmount: string
    meetup: { id: string; title: string; imageUrl: string | null; startsAt: string; status: string }
  }>
  upcomingMeetups: MeetupListItem[]
}

export type UserMe = {
  id: string
  email: string
  name: string
  createdAt: string
  emailVerified: boolean
  reputationScore: string
  stats?: { joinedMeetups: number; hostedMeetups: number; trustScore: string }
  joinedMeetups?: Array<{
    applicationId: string
    status: string
    lockedDorriAmount: string
    appliedAt: string
    meetup: { id: string; title: string; startsAt: string; imageUrl: string | null; locationName: string }
  }>
  hostedMeetups?: Array<{
    id: string
    title: string
    startsAt: string
    status: string
    capacity: number
    appliedCount: number
  }>
  wallet: { xrplAddress: string; network: string } | null
  dorri: { balance: string; trustLineStatus: string } | null
}

export type MeetupListItem = {
  id: string
  title: string
  hostName: string | null
  imageUrl: string | null
  locationName: string
  startsAt: string
  type: string
  depositDorri: string
  entryFeeDorri: string
  capacity: number
  appliedCount: number
  rating: number
  status: string
}

export type MeetupDetail = MeetupListItem & {
  description: string
  host: { id: string; name: string; profileImageUrl: string | null; rating: number; reviewCount: number }
  tags: string[]
  location: { name: string; address: string; mapImageUrl: string | null }
  endsAt: string
  lockedDorriAmount: string
  myApplication: { id: string; status: string; lockedDorriAmount: string } | null
}

export type OrganizerApplication = {
  id: string
  status: string
  lockedDorriAmount: string
  participant: {
    id: string
    name: string
    reputationScore: string
    xrplAddress: string | null
  }
  escrow: { status: string; createTxHash: string } | null
  settlement: { reason: string } | null
  participantReview: { id: string; rating: number; comment: string | null; createdAt: string } | null
  organizerEvaluation: { id: string; rating: number; blocked: boolean; createdAt: string } | null
}

export function getHome() {
  return apiFetch<HomeData>('/home')
}

export function getMe() {
  return apiFetch<UserMe>('/users/me')
}

export function getWallet() {
  return apiFetch<{ id: string; xrplAddress: string; network: string; createdAt: string }>('/wallets/me')
}

export function getDorriBalance() {
  return apiFetch<{ currency: string; balance: string; trustLineStatus: string; issuer: string; updatedAt: string }>('/dorri/balance')
}

export async function refreshDorriBalance(retries = 3, delayMs = 1200) {
  let lastBalance = await getDorriBalance()

  for (let index = 1; index < retries; index += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, delayMs))
    lastBalance = await getDorriBalance()
  }

  return lastBalance
}

export async function getWalletSummary() {
  const [wallet, dorri] = await Promise.allSettled([getWallet(), getDorriBalance()])

  return {
    wallet: wallet.status === 'fulfilled' ? wallet.value : null,
    dorri: dorri.status === 'fulfilled' ? dorri.value : null,
  }
}

export async function getMeetups(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const result = await apiFetch<{ meetups: MeetupListItem[] }>(`/meetups${query}`)
  return result.meetups
}

export function getMeetup(id: string) {
  return apiFetch<MeetupDetail>(`/meetups/${id}`)
}

export function applyMeetup(id: string) {
  return apiFetch(`/meetups/${id}/apply`, { method: 'POST' })
}

export function cancelApplication(applicationId: string) {
  return apiFetch(`/applications/${applicationId}/cancel`, { method: 'POST' })
}

export async function getOrganizerApplications(meetupId: string) {
  const result = await apiFetch<{ meetup: { id: string; title: string }; applications: OrganizerApplication[] }>(
    `/organizer/meetups/${meetupId}/applications`,
  )
  return result.applications
}

export function closeOrganizerMeetup(meetupId: string) {
  return apiFetch(`/organizer/meetups/${meetupId}/close`, { method: 'POST' })
}

export function updateOrganizerApplication(applicationId: string, action: 'approve' | 'reject' | 'check-in' | 'no-show') {
  return apiFetch(`/organizer/applications/${applicationId}/${action}`, { method: 'POST' })
}

export function settleApplication(applicationId: string) {
  return apiFetch(`/applications/${applicationId}/settle`, { method: 'POST' })
}

export function createApplicationReview(applicationId: string, input: { rating: number; tags: string[]; comment?: string }) {
  return apiFetch(`/applications/${applicationId}/review`, {
    method: 'POST',
    body: input,
  })
}

export function evaluateOrganizerParticipant(applicationId: string, input: { rating: number; tags: string[]; comment?: string; blocked?: boolean; blockReason?: string }) {
  return apiFetch(`/organizer/applications/${applicationId}/evaluate`, {
    method: 'POST',
    body: input,
  })
}

export type LedgerTx = {
  id: string
  txHash: string
  txType: string
  status: string
  createdAt: string
  validatedAt: string | null
  explorerUrl: string
}

export async function getLedgerTxs() {
  const result = await apiFetch<{ transactions: LedgerTx[] }>('/wallets/ledger-txs')
  return result.transactions
}

export type DorriRates = {
  base: string
  usdPerDorri: string
  rates: Array<{ currency: string; fiatPerDorri: string }>
  updatedAt: string
}

export function getDorriRates() {
  return apiFetch<DorriRates>('/dorri/rates')
}

export type ChargeQuote = {
  quoteId: string
  fiat: { currency: string; amount: string; rateToUsd: string }
  dorri: { currency: string; amount: string }
  expiresAt: string
}

export function createChargeQuote(input: { fiatCurrency: string; fiatAmount: string }) {
  return apiFetch<ChargeQuote>('/dorri/charge/quote', {
    method: 'POST',
    body: input,
  })
}

export function chargeDorri(quoteId: string) {
  return apiFetch<{
    charge: { id: string; amount: string; fiatCurrency: string | null; fiatAmount: string | null; status: string }
    balance: { currency: string; balance: string }
    tx: { txHash: string; status: string; explorerUrl: string }
  }>('/dorri/charge', {
    method: 'POST',
    body: { quoteId },
  })
}

export function createMeetup(input: {
  title: string
  description: string
  locationName: string
  address: string
  startsAt: string
  endsAt: string
  type: 'FREE' | 'PAID'
  depositDorri?: string
  entryFeeDorri?: string
  capacity: number
  tags?: string[]
}) {
  return apiFetch<{ id: string; title: string; type: string; status: string; createdAt: string }>('/meetups', {
    method: 'POST',
    body: input,
  })
}
