/*
 * Copyright (c) 2022, Ilya Ordin (https://gitlab.com/os-team/libs/utils)
 *
 * SPDX-License-Identifier: MIT
 */

import {execSync} from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import readline from 'readline'

import {timeToMs} from 'util/time'

class YoutubeCaptionsService {

    public static youtubeDlPath: string = "./youtube-dl"

    public static async getLanguages(videoId: string): Promise<string[]> {
        let stdout = '';

        try {
            console.log(process.cwd())
            stdout = execSync(
                `${YoutubeCaptionsService.youtubeDlPath} --list-subs 'https://www.youtube.com/watch?v=${videoId}'`
            ).toString();
        } catch (e) {
            return [];
        }

        const languages: string[] = [];
        let readingStarted = false;

        stdout.split('\n').forEach((line) => {
            if (line === `Available subtitles for ${videoId}:`) {
                readingStarted = true;
            }
            if (readingStarted) {
                const groups = line.match(
                    /^([a-z]{2}(-[a-z]{4})?)\s+[a-z0-9]+(,\s[a-z0-9]+)*$/i
                );
                if (groups) {
                    languages.push(groups[1]);
                }
            }
        });

        return languages;
    };

    public static async getCaptions(
        videoId: string,
        language: string,
        dir?: string
    ): Promise<Caption[]> {
        const hash = crypto.randomBytes(2).toString('hex');
        const name = `${videoId}-${hash}`;
        const filePath = path.resolve(dir || '', name);

        // Save the file with subtitles
        try {
            execSync(
                `${YoutubeCaptionsService.youtubeDlPath} --write-sub --sub-lang ${language} --convert-subs vtt -o ${filePath} --skip-download 'https://www.youtube.com/watch?v=${videoId}'`
            ).toString();

            const fullFilePath = `${filePath}.${language}.vtt`;

            const rl = readline.createInterface({
                input: fs.createReadStream(fullFilePath),
                crlfDelay: Infinity,
            });

            const captions: Caption[] = [];
            let cur: Caption | undefined;

            // eslint-disable-next-line no-restricted-syntax
            for await (const line of rl) {
                const trimmedLine = line.trim();
                const tm = trimmedLine.match(
                    /^(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})$/
                );

                if (tm) {
                    cur = {
                        text: '',
                        start: timeToMs(tm[1]),
                        end: timeToMs(tm[2]),
                    };
                    // eslint-disable-next-line no-continue
                    continue;
                }

                if (cur) {
                    if (trimmedLine) {
                        cur.text += `${cur.text} ${trimmedLine}`.trim();
                    } else {
                        captions.push(cur);
                        cur = undefined;
                    }
                }
            }

            // Delete the file with subtitles
            fs.unlinkSync(fullFilePath);

            return captions;
        } catch (e) {
            return [];
        }
    };
}

export default YoutubeCaptionsService
