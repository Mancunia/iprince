import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({ probe: { color: "rgb(200, 0, 0)" } });

export default function Home() {
  return <p {...stylex.props(styles.probe)} data-testid="stylex-probe">StyleX works</p>;
}
