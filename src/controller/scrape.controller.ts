import { Request, Response } from "express";
import {
  getScrapingStatus,
  scrapeOthersContent,
} from "../services/scrape.service";

export const refreshOthers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("🕷️  Manual scraping triggered");

    await scrapeOthersContent(true, 10);

    res.status(202).json({
      success: true,
      message: "Scraping initiated. This may take a few moments.",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to initiate scraping",
      error: error.message,
    });
  }
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await getScrapingStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to get scraping status",
      error: error.message,
    });
  }
};
