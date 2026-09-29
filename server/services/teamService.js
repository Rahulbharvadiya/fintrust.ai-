// Team Formation, Collaboration & Matchmaking Engine
const db = require('../db/databaseAdapter');

/**
 * Creates a Discord Rich Embed notification payload
 */
function buildDiscordWebhookPayload({ eventType, team, member, actorName }) {
  let title = `🚀 New Team Formed: ${team.name}`;
  let description = team.pitch_summary || 'No pitch summary provided yet.';
  let color = 0x0284c7; // Sky blue

  if (eventType === 'MEMBER_JOINED') {
    title = `👤 New Member Joined ${team.name}`;
    description = `**${member?.name || actorName}** has officially joined the team roster!`;
    color = 0x10b981; // Emerald green
  } else if (eventType === 'PROJECT_SUBMITTED') {
    title = `🏆 Project Submitted: ${team.name}`;
    description = `Team **${team.name}** has submitted their project for final judging!`;
    color = 0x8b5cf6; // Purple
  }

  return {
    username: 'Hackathon OS Bot',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
    embeds: [
      {
        title,
        description,
        color,
        fields: [
          { name: 'Track', value: team.track, inline: true },
          { name: 'Team Size', value: `${team.current_members_count} / ${team.max_members}`, inline: true },
          { name: 'Looking For', value: (team.looking_for_skills || []).join(', ') || 'Roster Full', inline: false }
        ],
        footer: { text: 'fintrust.ai • Hackathon Live Event Engine' },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Creates a Slack Block Kit notification payload
 */
function buildSlackWebhookPayload({ eventType, team, member, actorName }) {
  return {
    text: `[Hackathon OS] Team Update: ${team.name}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⚡ Team Update: ${team.name}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Track:*\n${team.track}` },
          { type: 'mrkdwn', text: `*Capacity:*\n${team.current_members_count}/${team.max_members}` },
          { type: 'mrkdwn', text: `*Event:*\n${eventType}` },
          { type: 'mrkdwn', text: `*Action by:*\n${actorName || 'Participant'}` }
        ]
      }
    ]
  };
}

/**
 * Dispatches async webhook notifications (simulated or real HTTP POST)
 */
async function notifyWebhooks({ team, eventType, member, actorName }) {
  const tasks = [];

  if (team.discord_webhook_url) {
    const discordPayload = buildDiscordWebhookPayload({ eventType, team, member, actorName });
    // In production this performs fetch(team.discord_webhook_url, { method: 'POST', body: JSON.stringify(discordPayload) })
    tasks.push(Promise.resolve({ target: 'DISCORD', status: 'DISPATCHED', payload: discordPayload }));
  }

  if (team.slack_webhook_url) {
    const slackPayload = buildSlackWebhookPayload({ eventType, team, member, actorName });
    tasks.push(Promise.resolve({ target: 'SLACK', status: 'DISPATCHED', payload: slackPayload }));
  }

  return Promise.all(tasks);
}

/**
 * Create a new team with member caps and webhook configuration
 */
async function createTeam({
  name,
  track = 'AI/ML & Automation',
  leaderId,
  maxMembers = 4,
  lookingForSkills = [],
  pitchSummary = '',
  discordWebhookUrl = null,
  slackWebhookUrl = null
}) {
  // Check if leader is already in a team
  const existingTeam = await db.getUserTeam(leaderId);
  if (existingTeam) {
    throw new Error('You are already registered as a member or leader of team "' + existingTeam.name + '".');
  }

  const team = await db.createTeam({
    name,
    track,
    leader_id: leaderId,
    max_members: maxMembers,
    looking_for_skills: lookingForSkills,
    pitch_summary: pitchSummary,
    discord_webhook_url: discordWebhookUrl,
    slack_webhook_url: slackWebhookUrl
  });

  // Dispatch webhook notification
  const leaderProfile = await db.getProfileById(leaderId);
  await notifyWebhooks({
    team,
    eventType: 'TEAM_CREATED',
    actorName: leaderProfile?.full_name || 'Leader'
  });

  return team;
}

/**
 * Join team using secret invite code
 */
async function joinTeamWithInviteCode({ inviteCode, userId, roleInTeam = 'FULLSTACK' }) {
  const team = await db.getTeamByInviteCode(inviteCode);
  if (!team) {
    throw new Error('Invalid invite code. Please verify the 6-character code with your team leader.');
  }

  const result = await db.addMemberToTeam({
    teamId: team.id,
    userId,
    roleInTeam
  });

  const memberProfile = await db.getProfileById(userId);
  await notifyWebhooks({
    team: result.team,
    eventType: 'MEMBER_JOINED',
    member: memberProfile,
    actorName: memberProfile?.full_name
  });

  return result;
}

module.exports = {
  createTeam,
  joinTeamWithInviteCode,
  buildDiscordWebhookPayload,
  buildSlackWebhookPayload,
  notifyWebhooks
};
