const fs = require('fs');

const file = 'lib/services/gemini-prospecting.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    for (const prospect of verifiedProspects) {
      const { nameKey, urlKey } = prospectIdentityKeys(prospect.companyName, prospect.websiteUrl);

      const matchesCrm =
        (nameKey.length > 0 && excludedNameKeys.has(nameKey)) || (urlKey.length > 0 && excludedUrlKeys.has(urlKey));
      const matchesBatch =
        (nameKey.length > 0 && seenInBatchNameKeys.has(nameKey)) ||
        (urlKey.length > 0 && seenInBatchUrlKeys.has(urlKey));

      if (matchesCrm || matchesBatch) {
        duplicates++;
        continue;
      }

      if (!nameKey.length && !urlKey.length) {
        errors++;
        continue;
      }

      try {
        await prisma.lead.create({
          data: {
            clientId: config.clientId,
            customerName: prospect.companyName,
            source: "OUTBOUND_PROSPECT",
            status: "DRAFT_PENDING",
            scrapedData: {
              websiteUrl: prospect.websiteUrl,
              draftSubject: prospect.draftSubject,
              draftBody: prospect.draftBody,
              businessDescription: prospect.auditSummary,
              hasChatbot: prospect.aiPresence,
              hasVoiceAgent: false,
              painPoints: prospect.painPoints,
              targetOutreachAngle: "",
              coreServices: [],
            },
          },
        });
        added++;
        if (nameKey.length > 0) {
          seenInBatchNameKeys.add(nameKey);
          excludedNameKeys.add(nameKey);
        }
        if (urlKey.length > 0) {
          seenInBatchUrlKeys.add(urlKey);
          excludedUrlKeys.add(urlKey);
        }
      } catch {
        errors++;
      }
    }

    return { added, duplicates, errors, rejected: rejectedCount };`;

const replacement = `    const leadsToCreate: any[] = [];

    for (const prospect of verifiedProspects) {
      const { nameKey, urlKey } = prospectIdentityKeys(prospect.companyName, prospect.websiteUrl);

      const matchesCrm =
        (nameKey.length > 0 && excludedNameKeys.has(nameKey)) || (urlKey.length > 0 && excludedUrlKeys.has(urlKey));
      const matchesBatch =
        (nameKey.length > 0 && seenInBatchNameKeys.has(nameKey)) ||
        (urlKey.length > 0 && seenInBatchUrlKeys.has(urlKey));

      if (matchesCrm || matchesBatch) {
        duplicates++;
        continue;
      }

      if (!nameKey.length && !urlKey.length) {
        errors++;
        continue;
      }

      leadsToCreate.push({
        clientId: config.clientId,
        customerName: prospect.companyName,
        source: "OUTBOUND_PROSPECT",
        status: "DRAFT_PENDING",
        scrapedData: {
          websiteUrl: prospect.websiteUrl,
          draftSubject: prospect.draftSubject,
          draftBody: prospect.draftBody,
          businessDescription: prospect.auditSummary,
          hasChatbot: prospect.aiPresence,
          hasVoiceAgent: false,
          painPoints: prospect.painPoints,
          targetOutreachAngle: "",
          coreServices: [],
        },
      });

      if (nameKey.length > 0) {
        seenInBatchNameKeys.add(nameKey);
        excludedNameKeys.add(nameKey);
      }
      if (urlKey.length > 0) {
        seenInBatchUrlKeys.add(urlKey);
        excludedUrlKeys.add(urlKey);
      }
    }

    if (leadsToCreate.length > 0) {
      try {
        const result = await prisma.lead.createMany({
          data: leadsToCreate,
        });
        added += result.count;
      } catch {
        errors += leadsToCreate.length;
      }
    }

    return { added, duplicates, errors, rejected: rejectedCount };`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Successfully patched");
} else {
  console.log("Target not found");
}
