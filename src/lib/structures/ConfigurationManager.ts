import { Collection } from 'discord.js';
import Configuration from '@/models/configuration';
import type MonkaClient from '@/structures/MonkaClient';
import type { GuildTextBasedChannel } from '@/types';
import type { ConfigEntries, ConfigurationDocument } from '@/types/database';
import { nullop } from '@/utils';

export default class ConfigurationManager {
  // TODO: Make this linear, not nested.
  channels: Collection<string, Record<ConfigEntries, GuildTextBasedChannel>>;

  constructor(public readonly client: MonkaClient) {}

  public async set(channel: ConfigEntries, value: GuildTextBasedChannel): Promise<void> {
    await Configuration.findOneAndUpdate(
      { guild: value.guild.id, name: channel },
      { guild: value.guild.id, value: value.id },
      { upsert: true },
    );
    this.channels.set(value.guild.id, { [channel]: value } as Record<ConfigEntries, GuildTextBasedChannel>);
  }

  public async get(guildID: string, channel: ConfigEntries): Promise<GuildTextBasedChannel> {
    if (this.channels.get(guildID)?.[channel])
      return this.channels.get(guildID)[channel];

    const result = await Configuration.findOne({ guild: guildID, name: channel }).catch(nullop);
    if (result?.value) {
      const resolvedChannel = this.client.channels.resolve(result.value);
      if (resolvedChannel.isText() && resolvedChannel.type !== 'DM') {
        this.channels.set(guildID, { [channel]: resolvedChannel } as Record<ConfigEntries, GuildTextBasedChannel>);
        return resolvedChannel;
      }
    }
  }

  public async loadAll(): Promise<void> {
    this.channels = new Collection();
    const configuredChannels: ConfigurationDocument[] = await Configuration.find().catch(nullop);
    if (!configuredChannels)
      return;

    for (const channel of configuredChannels) {
      this.channels.set(
        channel.guild,
        {
          ...this.channels.get(channel.guild),
          [channel.name]: this.client.channels.resolve(channel.value),
        } as Record<ConfigEntries, GuildTextBasedChannel>,
      );
    }
  }
}
