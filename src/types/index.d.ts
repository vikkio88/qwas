type Command = {
  id: number;
  description: string;
  tags: string[];
  createdAt: string | Date;
};

type Db = {
  lastId: number;
  commands: Command[];
};
