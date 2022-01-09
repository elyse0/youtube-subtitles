import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({origin: "*"}))

app.listen(process.env.PORT ?? 3000, () => console.log("Server running"))

import YoutubeCaptionsService from "services/YoutubeCaptionsService"
import {isString} from "util/validation"

app.get("/:videoId/:languageId?", async (req: express.Request, res: express.Response) => {

    const { videoId, languageId } = req.params

    if (!isString(videoId)) {
        return res.status(400).json({error: "'videoId' must be provided in query string"})
    }

    const languages = await YoutubeCaptionsService.getLanguages(videoId)
    if (!isString(languageId)) {
        return res.status(400).json({videoId, languages})
    }

    if (!languages.includes(languageId)) {
        return res.status(400).json({error: "The 'languageId' is not available for the video provided"})
    }

    const captions = await YoutubeCaptionsService.getCaptions(videoId, languageId)
    return res.status(200).json({videoId, languageId, captions})
})

// Return 404 if route was not found
app.use((req: express.Request, res: express.Response) => {
    return res.status(404).json({
        error: { code: 404, message: "Resource not found", status: "Not found" },
    });
});
