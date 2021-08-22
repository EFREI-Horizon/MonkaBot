import { ApplyOptions } from '@sapphire/decorators';
import dayjs from 'dayjs';
import groupBy from 'lodash.groupby';
import pupa from 'pupa';
import messages from '@/config/messages';
import settings from '@/config/settings';
import Eclass from '@/models/eclass';
import Task from '@/structures/Task';
import type { TaskOptions } from '@/structures/Task';
import type { EclassDocument } from '@/types/database';
import { ConfigEntries, EclassStatus } from '@/types/database';
import { capitalize, nullop, splitText } from '@/utils';

@ApplyOptions<TaskOptions>({ cron: '0 0 * * *' })
export default class UpdateUpcomingClassesTask extends Task {
  public async run(): Promise<void> {
    for (const guildId of this.context.client.guilds.cache.keys()) {
      const channel = await this.context.client.configManager.get(guildId, ConfigEntries.WeekUpcomingClasses);
      if (!channel) {
        this.context.logger.warn(`[Upcoming Classes] Needing to update week's upcoming classes but no announcement channel was found for guild ${guildId}. Setup an announcement channel with "${settings.prefix}setup week-class"`);
        continue;
      }

      const upcomingClasses = await Eclass.find({
        $and: [
          { date: { $lte: dayjs().add(1, 'week').unix() * 1000 } },
          { date: { $gte: Date.now() } },
          { status: EclassStatus.Planned },
          { guild: guildId },
        ],
      });

      const content = this._generateUpcomingClassesMessage(upcomingClasses);
      const chunks = splitText(content);

      const allMessages = await channel.messages.fetch().catch(nullop);
      const allBotMessages = [
        ...allMessages
          .filter(msg => msg.author.id === this.context.client.id)
          .values(),
      ].reverse();

      let i = 0;
      for (const chunk of chunks) {
        // eslint-disable-next-line unicorn/prefer-ternary
        if (allBotMessages[i]?.editable)
          await allBotMessages[i].edit(chunk);
        else
          await channel.send(chunk);
        i++;
      }

      if (i < allBotMessages.length)
        allBotMessages.slice(i).map(async msg => await msg.delete());

      this.context.logger.debug('[Upcoming Classes] Updated classes.');
    }
  }

  private _generateUpcomingClassesMessage(upcomingClasses: EclassDocument[]): string {
    // Sort the upcoming classes by date.
    upcomingClasses.sort((a, b) => a.date - b.date);
    // Group together classes that are the same day
    const classGroupsObj = groupBy(upcomingClasses, val => new Date(val.date).getDate());
    const classGroups = Object.values(classGroupsObj);
    // Sort the groups we get by date, because we don't necessarily want Monday to be the first day displayed
    classGroups.sort((grpA, grpB) => grpA[0].date - grpB[0].date);

    let builder = messages.upcomingClasses.header;

    if (classGroups.length > 0) {
      for (const classGroup of classGroups) {
        const begin = dayjs(classGroup[0].date);
        builder += `**${capitalize(begin.format('dddd DD/MM'))}**\n`;

        for (const eclass of classGroup) {
          const beginHour = dayjs(eclass.date).hour().toString().padStart(2, '0');
          const endHour = dayjs(eclass.end).hour().toString().padStart(2, '0');
          builder += pupa(messages.upcomingClasses.classLine, { beginHour, endHour, eclass });
        }
        builder += '\n';
      }
    } else {
      builder += messages.upcomingClasses.noClasses;
    }

    return builder;
  }
}
