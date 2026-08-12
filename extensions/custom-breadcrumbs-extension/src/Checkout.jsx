
import '@shopify/ui-extensions/preact';
import {render} from "preact";

export default function() {
  render(<Extension />, document.body)
}

function Extension() {
  const {
    i18n,
    buyerJourney: {steps, activeStep},
    shop: {storefrontUrl}
  } = shopify;

  const journeySteps = (steps?.current ?? []).filter(
    ({handle}) => handle !== 'cart',
  );

  const assembledSteps = [
    {
      label: i18n.translate('cart'),
      handle: 'cart',
      to: new URL('/cart', storefrontUrl).href,
    },
    ...journeySteps,
  ];

  const activeStepIndex = assembledSteps.findIndex(
    ({handle}) => handle === activeStep?.current?.handle,
  );

  const columns = `repeat(${assembledSteps.length}, 1fr)`

  return (
    <s-grid
      accessibilityRole="ordered-list"
      border="base base solid"
      borderRadius="base"
      gridTemplateColumns={columns}
    >
      {assembledSteps.map(({label, handle, to}, index) => (
        <s-grid
          accessibilityRole="list-item"
          background={index === activeStepIndex ? 'subdued' : 'transparent'}
          borderStyle={index === assembledSteps.length - 1 ? "none" : "none solid none none"}
          borderWidth="base"
          justifyItems="center"
          padding="small-300"
          key={handle}
        >
          {index < activeStepIndex || handle === 'cart' ? (
            <s-link href={to}>{label}</s-link>
          ) : (
            <s-text>{label}</s-text>
          )}
        </s-grid>
      ))}
    </s-grid>
  );
}