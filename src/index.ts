import express, { Application, Request, Response } from 'express';
import path from 'path';
const app: Application = express();

const PORT = 3001;

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname,'index.html'));
});

try {
  app.listen(PORT, (): void => {
    console.log(`Connected successfully on port ${PORT}`);
  });
} catch (error: any) {
  console.error(`Error occurred: ${error.message}`);
}
