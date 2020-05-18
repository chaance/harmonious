declare module 'postcss-js' {
  import postcss from 'postcss';
  function atRule(node: any): boolean | ReturnType<PostCssJs['objectify']>;
  type PostCssJs = {
    objectify: (
      node: any
    ) => {
      [key: string]:
        | ReturnType<typeof atRule>
        | ReturnType<typeof atRule>[]
        | string
        | string[];
    };
    parse: (obj: any) => ReturnType<typeof postcss.root>;
    async: (plugins: any) => (input: any) => Promise<any>;
    sync: (plugins: any) => (input: any) => any;
  };

  // const postcssJs: PostCssJs;
  const postcssJs: any;

  export = postcssJs;
}
