import type { NextApiRequest, NextApiResponse } from 'next';
import { addCorsAndCache } from '../../../src/server/climbing-tiles/addCorsAndCache';
import {
  getClimbingCragsCsv,
  parseCountriesParam,
} from '../../../src/server/climbing-tiles/getClimbingCragsCsv';
import { PROJECT_URL, setProjectForSSR } from '../../../src/services/project';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  addCorsAndCache(res);
  try {
    setProjectForSSR(req);
    const countries = parseCountriesParam(req.query.country);
    const csv = getClimbingCragsCsv(PROJECT_URL, countries);

    res
      .status(200)
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader(
        'Content-Disposition',
        `inline; filename="climbing-crags-${countries.join('-')}.csv"`,
      )
      .send(csv);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
