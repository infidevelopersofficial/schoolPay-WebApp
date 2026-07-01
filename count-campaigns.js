require('dotenv').config({ path: '.env' })
const { prisma } = require('./lib/prisma')

async function main() {
  const campaigns = await prisma.communicationCampaign.count()
  const recipients = await prisma.campaignRecipient.count()

  console.log(`Live DB Count - Campaigns: ${campaigns}`)
  console.log(`Live DB Count - Recipients: ${recipients}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
