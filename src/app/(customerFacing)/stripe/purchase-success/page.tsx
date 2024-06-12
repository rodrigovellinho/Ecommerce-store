import db from "@/app/db/db";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatter";
import Link from "next/link";
import { notFound } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function SucessPage({
  searchParams,
}: {
  searchParams: { payment_intent: string };
}) {
  const payment_intent = await stripe.paymentIntents.retrieve(
    searchParams.payment_intent
  );

  if (payment_intent.metadata.productId == null) return notFound();

  const product = await db.product.findUnique({
    where: { id: payment_intent.metadata.productId },
  });

  if (product == null) return notFound();

  const isSuccess = payment_intent.status === "succeeded";

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <h1 className="text-4-xl font-bold">
        {isSuccess ? "Success" : "Error"}{" "}
      </h1>
      <div className="flex gap-4 items-center">
        {/*       <div className="aspect-video flex-shrink-0 w-1/3 relative">
            <Image
              src={product.imagePath}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div> */}
        <div className="text-lg">
          {formatCurrency(product.priceInCents / 100)}
        </div>
        <h1 className="text-2-xl font-bold">{product.name}</h1>
        <div className="line-clamp-3 texzt-muted-foreground">
          {product.description}
        </div>
        <Button className="mt-4" size="lg" asChild>
          {isSuccess ? (
            <a
              href={`/products/download/${await createDownloadVerification(
                product.id
              )}`}
            >
              Download
            </a>
          ) : (
            <Link href={`/products/${product.id}/purchase`}>Try Again</Link>
          )}
        </Button>
      </div>
    </div>
  );
}

async function createDownloadVerification(productId: string) {
  return (
    await db.downloadVerification.create({
      data: {
        productId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    })
  ).id;
}
