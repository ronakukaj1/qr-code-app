use super::schema;
use shopify_function::prelude::*;
use shopify_function::Result;

#[shopify_function]
fn cart_delivery_options_transform_run(
    input: schema::cart_delivery_options_transform_run::Input,
) -> Result<schema::CartDeliveryOptionsTransformRunResult> {
    let message = "May be delayed due to weather conditions";

    let operations = input
        .cart()
        .delivery_groups()
        .iter()
        .filter_map(|group| {
            let address = group.delivery_address()?;
            if address.province_code().is_none_or(|code| code != "NC") {
                return None;
            }

            Some(
                group
                    .delivery_options()
                    .iter()
                    .map(|option| {
                        schema::Operation::DeliveryOptionRename(
                            schema::DeliveryOptionRenameOperation {
                                delivery_option_handle: option.handle().to_string(),
                                title: match option.title() {
                                    Some(title) => format!("{} - {}", title, message),
                                    None => message.to_string(),
                                },
                            },
                        )
                    })
                    .collect::<Vec<_>>(),
            )
        })
        .flatten()
        .collect();

    Ok(schema::CartDeliveryOptionsTransformRunResult { operations })
}
