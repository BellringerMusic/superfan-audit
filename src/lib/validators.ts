import { z } from 'zod';
import { normalizeUrl, extractSocialHandle } from './utils';

export const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Country',
  'Jazz', 'Classical', 'Latin', 'Indie', 'Folk', 'Metal',
  'Punk', 'Blues', 'Reggae', 'Gospel', 'World', 'Other',
] as const;

export const INCOME_TIERS = [
  '$0 - $500',
  '$500 - $2K',
  '$2K - $5K',
  '$5K - $10K',
  '$10K - $25K',
  '$25K+',
] as const;

export const YEARS_ACTIVE = [
  'Less than 1 year',
  '1-2 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
] as const;

const spotifyUrlPattern = /^https?:\/\/(open\.)?spotify\.com\/(artist|intl-[a-z]+\/artist)\/[a-zA-Z0-9]+/;
const youtubeUrlPattern = /^https?:\/\/((www|m|music)\.)?(youtube\.com\/(channel\/|@|c\/|user\/)|youtu\.be\/)/;
const instagramHandlePattern = /^[a-zA-Z0-9._]{1,30}$/;
const tiktokHandlePattern = /^[a-zA-Z0-9._]{1,24}$/;
const websiteUrlPattern = /^https?:\/\/[^\s.]+\.[^\s]+$/;

/**
 * Build a string schema that normalizes the user's input first, then
 * runs the pattern check on the normalized value. Empty stays empty.
 */
function lenientUrl(pattern: RegExp, message: string) {
  return z.string()
    .transform(normalizeUrl)
    .refine(s => s === '' || pattern.test(s), message);
}

function lenientHandle(platform: 'instagram' | 'tiktok', pattern: RegExp, message: string) {
  return z.string()
    .transform(s => extractSocialHandle(s, platform))
    .refine(s => s === '' || pattern.test(s), message);
}

export const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  consent: z.literal(true, 'You must agree to receive your report via email'),
});

export const step2Schema = z.object({
  artistName: z.string().min(1, 'Artist or band name is required').max(100),
  genre: z.string().min(1, 'Please select a genre'),
  monthlyIncome: z.string().min(1, 'Please select your income range'),
  yearsActive: z.string().min(1, 'Please select how long you\'ve been active'),
});

export const step3Schema = z.object({
  spotifyUrl: lenientUrl(spotifyUrlPattern, 'Please enter a valid Spotify artist URL'),
  youtubeUrl: lenientUrl(youtubeUrlPattern, 'Please enter a valid YouTube channel URL'),
  instagramHandle: lenientHandle('instagram', instagramHandlePattern, 'Please enter a valid Instagram handle'),
  instagramFollowers: z.string().regex(/^[0-9,]*$/, 'Please enter a number').or(z.literal('')),
  tiktokHandle: lenientHandle('tiktok', tiktokHandlePattern, 'Please enter a valid TikTok handle'),
  websiteUrl: lenientUrl(websiteUrlPattern, 'Please enter a valid website URL'),
}).refine(
  (data) => {
    return !!(data.spotifyUrl || data.youtubeUrl || data.instagramHandle || data.tiktokHandle || data.websiteUrl);
  },
  { message: 'Please provide at least one link so we can scan your presence', path: ['spotifyUrl'] }
);

export const fullFormSchema = step1Schema.merge(step2Schema).merge(
  z.object({
    spotifyUrl: z.string().optional().default(''),
    youtubeUrl: z.string().optional().default(''),
    instagramHandle: z.string().optional().default(''),
    instagramFollowers: z.string().optional().default(''),
    tiktokHandle: z.string().optional().default(''),
    websiteUrl: z.string().optional().default(''),
  })
);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
